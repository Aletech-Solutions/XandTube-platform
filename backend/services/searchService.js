const { Download, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Advanced Search Service with Fuzzy Search Capabilities
 * Provides intelligent search across the entire video database
 */
class SearchService {
  constructor() {
    this.searchWeights = {
      title: 3,        // Title matches are most important
      channelName: 2,  // Channel matches are important
      description: 1,  // Description matches are less important
      metadata: 0.5    // Metadata matches are least important
    };
  }

  /**
   * Advanced fuzzy search across all videos in database
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results with relevance scoring
   */
  async fuzzySearch(query, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      sortOrder = 'DESC',
      filters = {},
      includeMetadata = true
    } = options;

    try {
      console.log(`🔍 Fuzzy search for: "${query}"`);

      if (!query || query.trim().length === 0) {
        return this.getAllVideos(options);
      }

      const searchTerms = this.preprocessQuery(query);
      const whereClause = this.buildWhereClause(searchTerms, filters);
      
      // Get all matching videos without pagination first for relevance scoring
      const allMatches = await Download.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'fullName']
          }
        ],
        attributes: [
          'id', 'youtubeId', 'title', 'description', 'channelName', 'channelId',
          'duration', 'downloadedAt', 'category', 'source', 'thumbnailPath',
          'videoPath', 'fileSize', 'resolution', 'format', 'status',
          ...(includeMetadata ? ['metadata'] : [])
        ]
      });

      // Calculate relevance scores
      const scoredResults = allMatches.map(video => ({
        ...video.toJSON(),
        relevanceScore: this.calculateRelevanceScore(video, searchTerms, query)
      }));

      // Sort by relevance or other criteria
      const sortedResults = this.sortResults(scoredResults, sortBy, sortOrder);

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedResults = sortedResults.slice(offset, offset + limit);

      // Remove relevance score from final results if not needed
      const finalResults = paginatedResults.map(video => {
        const { relevanceScore, ...videoData } = video;
        return videoData;
      });

      return {
        success: true,
        query,
        searchTerms,
        videos: finalResults,
        total: scoredResults.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(scoredResults.length / limit),
        searchStats: this.getSearchStats(scoredResults, searchTerms),
        filters
      };

    } catch (error) {
      console.error('❌ Error in fuzzy search:', error);
      throw error;
    }
  }

  /**
   * Preprocess search query into searchable terms
   */
  preprocessQuery(query) {
    const cleanQuery = query.toLowerCase().trim();
    
    // Split into individual terms and remove empty strings
    const terms = cleanQuery
      .split(/[\s,]+/)
      .filter(term => term.length > 0)
      .map(term => term.replace(/[^\w\s]/g, '')); // Remove special characters
    
    // Generate fuzzy variations for each term
    const fuzzyTerms = [];
    
    terms.forEach(term => {
      fuzzyTerms.push(term); // Exact term
      
      // Add partial matches for longer terms
      if (term.length > 3) {
        fuzzyTerms.push(term.substring(0, term.length - 1)); // Remove last char
        fuzzyTerms.push(term.substring(1)); // Remove first char
      }
      
      // Add common typo patterns
      if (term.length > 2) {
        // Swap adjacent characters (common typo)
        for (let i = 0; i < term.length - 1; i++) {
          const chars = term.split('');
          [chars[i], chars[i + 1]] = [chars[i + 1], chars[i]];
          fuzzyTerms.push(chars.join(''));
        }
      }
    });

    return {
      original: cleanQuery,
      terms: [...new Set(terms)], // Remove duplicates
      fuzzyTerms: [...new Set(fuzzyTerms)], // Remove duplicates
      exactPhrase: cleanQuery
    };
  }

  /**
   * Build comprehensive WHERE clause for fuzzy search
   */
  buildWhereClause(searchTerms, filters = {}) {
    const whereClause = {};
    
    // Apply filters first
    if (filters.category) {
      whereClause.category = filters.category;
    }
    
    if (filters.source) {
      whereClause.source = filters.source;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      whereClause.downloadedAt = {};
      if (filters.dateFrom) {
        whereClause.downloadedAt[Op.gte] = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        whereClause.downloadedAt[Op.lte] = new Date(filters.dateTo);
      }
    }

    // Build search conditions
    const searchConditions = [];

    // Exact phrase matching (highest priority)
    if (searchTerms.exactPhrase.length > 2) {
      searchConditions.push({
        [Op.or]: [
          { title: { [Op.like]: `%${searchTerms.exactPhrase}%` } },
          { channelName: { [Op.like]: `%${searchTerms.exactPhrase}%` } },
          { description: { [Op.like]: `%${searchTerms.exactPhrase}%` } }
        ]
      });
    }

    // Individual term matching
    searchTerms.terms.forEach(term => {
      if (term.length > 1) {
        searchConditions.push({
          [Op.or]: [
            { title: { [Op.like]: `%${term}%` } },
            { channelName: { [Op.like]: `%${term}%` } },
            { description: { [Op.like]: `%${term}%` } },
            { youtubeId: { [Op.like]: `%${term}%` } }
          ]
        });
      }
    });

    // Fuzzy term matching (for typos and partial matches)
    searchTerms.fuzzyTerms.forEach(term => {
      if (term.length > 2 && !searchTerms.terms.includes(term)) {
        searchConditions.push({
          [Op.or]: [
            { title: { [Op.like]: `%${term}%` } },
            { channelName: { [Op.like]: `%${term}%` } }
          ]
        });
      }
    });

    // Metadata search (if available)
    searchTerms.terms.forEach(term => {
      if (term.length > 2) {
        searchConditions.push({
          [Op.or]: [
            { 'metadata.tags': { [Op.like]: `%${term}%` } },
            { 'metadata.categories': { [Op.like]: `%${term}%` } }
          ]
        });
      }
    });

    if (searchConditions.length > 0) {
      whereClause[Op.or] = searchConditions;
    }

    return whereClause;
  }

  /**
   * Calculate relevance score for search results
   */
  calculateRelevanceScore(video, searchTerms, originalQuery) {
    let score = 0;
    const videoData = video.toJSON ? video.toJSON() : video;

    // Exact phrase matching (bonus points)
    if (searchTerms.exactPhrase.length > 2) {
      if (videoData.title && videoData.title.toLowerCase().includes(searchTerms.exactPhrase)) {
        score += 50 * this.searchWeights.title;
      }
      if (videoData.channelName && videoData.channelName.toLowerCase().includes(searchTerms.exactPhrase)) {
        score += 50 * this.searchWeights.channelName;
      }
      if (videoData.description && videoData.description.toLowerCase().includes(searchTerms.exactPhrase)) {
        score += 50 * this.searchWeights.description;
      }
    }

    // Individual term matching
    searchTerms.terms.forEach(term => {
      // Title matches
      if (videoData.title) {
        const titleLower = videoData.title.toLowerCase();
        if (titleLower.includes(term)) {
          score += 10 * this.searchWeights.title;
          // Bonus for exact word match
          if (titleLower.split(/\s+/).includes(term)) {
            score += 5 * this.searchWeights.title;
          }
        }
      }

      // Channel name matches
      if (videoData.channelName) {
        const channelLower = videoData.channelName.toLowerCase();
        if (channelLower.includes(term)) {
          score += 10 * this.searchWeights.channelName;
          if (channelLower.split(/\s+/).includes(term)) {
            score += 5 * this.searchWeights.channelName;
          }
        }
      }

      // Description matches
      if (videoData.description) {
        const descLower = videoData.description.toLowerCase();
        if (descLower.includes(term)) {
          score += 5 * this.searchWeights.description;
        }
      }

      // YouTube ID matches (exact)
      if (videoData.youtubeId && videoData.youtubeId.toLowerCase() === term) {
        score += 100; // Very high score for exact ID match
      }
    });

    // Metadata matches
    if (videoData.metadata) {
      searchTerms.terms.forEach(term => {
        if (videoData.metadata.tags && Array.isArray(videoData.metadata.tags)) {
          videoData.metadata.tags.forEach(tag => {
            if (tag.toLowerCase().includes(term)) {
              score += 3 * this.searchWeights.metadata;
            }
          });
        }
        
        if (videoData.metadata.categories && Array.isArray(videoData.metadata.categories)) {
          videoData.metadata.categories.forEach(category => {
            if (category.toLowerCase().includes(term)) {
              score += 3 * this.searchWeights.metadata;
            }
          });
        }
      });
    }

    // Recency bonus (newer videos get slight boost)
    if (videoData.downloadedAt) {
      const daysSinceDownload = (Date.now() - new Date(videoData.downloadedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDownload < 7) {
        score += 5; // Recent videos get small boost
      }
    }

    // Popular video bonus (if view count available)
    if (videoData.metadata && videoData.metadata.view_count) {
      const views = videoData.metadata.view_count;
      if (views > 1000000) score += 3;
      else if (views > 100000) score += 2;
      else if (views > 10000) score += 1;
    }

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Sort search results by various criteria
   */
  sortResults(results, sortBy, sortOrder) {
    const order = sortOrder.toUpperCase() === 'ASC' ? 1 : -1;

    return results.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return (b.relevanceScore - a.relevanceScore) * order;
        
        case 'title':
          return a.title.localeCompare(b.title) * order;
        
        case 'channelName':
          return (a.channelName || '').localeCompare(b.channelName || '') * order;
        
        case 'downloadedAt':
          return (new Date(b.downloadedAt) - new Date(a.downloadedAt)) * order;
        
        case 'duration':
          return ((b.duration || 0) - (a.duration || 0)) * order;
        
        case 'fileSize':
          return ((b.fileSize || 0) - (a.fileSize || 0)) * order;
        
        default:
          return (b.relevanceScore - a.relevanceScore) * order;
      }
    });
  }

  /**
   * Get search statistics
   */
  getSearchStats(results, searchTerms) {
    const stats = {
      totalResults: results.length,
      averageRelevance: 0,
      topCategories: {},
      topChannels: {},
      matchTypes: {
        titleMatches: 0,
        channelMatches: 0,
        descriptionMatches: 0
      }
    };

    if (results.length === 0) return stats;

    // Calculate average relevance
    const totalRelevance = results.reduce((sum, video) => sum + (video.relevanceScore || 0), 0);
    stats.averageRelevance = Math.round((totalRelevance / results.length) * 100) / 100;

    // Count categories and channels
    results.forEach(video => {
      // Categories
      if (video.category) {
        stats.topCategories[video.category] = (stats.topCategories[video.category] || 0) + 1;
      }

      // Channels
      if (video.channelName) {
        stats.topChannels[video.channelName] = (stats.topChannels[video.channelName] || 0) + 1;
      }

      // Match types
      searchTerms.terms.forEach(term => {
        if (video.title && video.title.toLowerCase().includes(term)) {
          stats.matchTypes.titleMatches++;
        }
        if (video.channelName && video.channelName.toLowerCase().includes(term)) {
          stats.matchTypes.channelMatches++;
        }
        if (video.description && video.description.toLowerCase().includes(term)) {
          stats.matchTypes.descriptionMatches++;
        }
      });
    });

    return stats;
  }

  /**
   * Get all videos when no search query provided
   */
  async getAllVideos(options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'downloadedAt',
      sortOrder = 'DESC',
      filters = {}
    } = options;

    const whereClause = {};
    
    // Apply filters
    if (filters.category) whereClause.category = filters.category;
    if (filters.source) whereClause.source = filters.source;
    if (filters.dateFrom || filters.dateTo) {
      whereClause.downloadedAt = {};
      if (filters.dateFrom) whereClause.downloadedAt[Op.gte] = new Date(filters.dateFrom);
      if (filters.dateTo) whereClause.downloadedAt[Op.lte] = new Date(filters.dateTo);
    }

    const offset = (page - 1) * limit;
    const validSortFields = ['downloadedAt', 'title', 'channelName', 'fileSize', 'duration'];
    const validSortBy = validSortFields.includes(sortBy) ? sortBy : 'downloadedAt';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const { count, rows } = await Download.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'fullName']
        }
      ],
      order: [[validSortBy, validSortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      success: true,
      query: '',
      videos: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit),
      filters
    };
  }

  /**
   * Search suggestions based on existing data
   */
  async getSearchSuggestions(query, limit = 10) {
    try {
      if (!query || query.length < 2) return [];

      const suggestions = new Set();
      
      // Get title suggestions
      const titleMatches = await Download.findAll({
        where: {
          title: { [Op.like]: `%${query}%` }
        },
        attributes: ['title'],
        limit: limit * 2,
        order: [['downloadedAt', 'DESC']]
      });

      titleMatches.forEach(video => {
        if (video.title) suggestions.add(video.title);
      });

      // Get channel suggestions
      const channelMatches = await Download.findAll({
        where: {
          channelName: { [Op.like]: `%${query}%` }
        },
        attributes: ['channelName'],
        limit: limit,
        order: [['downloadedAt', 'DESC']]
      });

      channelMatches.forEach(video => {
        if (video.channelName) suggestions.add(video.channelName);
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting search suggestions:', error);
      return [];
    }
  }
}

module.exports = new SearchService();
