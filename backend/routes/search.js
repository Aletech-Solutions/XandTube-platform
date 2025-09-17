const express = require('express');
const searchService = require('../services/searchService');
const router = express.Router();

/**
 * Advanced Search Routes with Fuzzy Search Capabilities
 */

/**
 * GET /api/search
 * Advanced fuzzy search across all videos
 */
router.get('/', async (req, res) => {
  try {
    const {
      q: query,
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      sortOrder = 'DESC',
      category,
      source,
      dateFrom,
      dateTo,
      includeMetadata = 'true'
    } = req.query;

    console.log(`🔍 Search request: "${query}" with ${Object.keys(req.query).length} parameters`);

    // Build filters
    const filters = {};
    if (category) filters.category = category;
    if (source) filters.source = source;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    // Search options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      filters,
      includeMetadata: includeMetadata === 'true'
    };

    // Perform fuzzy search
    const results = await searchService.fuzzySearch(query, options);

    // Add search metadata
    const response = {
      ...results,
      searchTime: Date.now(),
      searchType: query ? 'fuzzy_search' : 'browse_all',
      pagination: {
        currentPage: results.page,
        totalPages: results.totalPages,
        totalResults: results.total,
        hasNextPage: results.page < results.totalPages,
        hasPrevPage: results.page > 1,
        resultsPerPage: results.limit
      }
    };

    console.log(`✅ Search completed: ${results.total} results found`);
    res.json(response);

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during search',
      message: error.message
    });
  }
});

/**
 * GET /api/search/suggestions
 * Get search suggestions based on query
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        suggestions: [],
        message: 'Query too short for suggestions'
      });
    }

    const suggestions = await searchService.getSearchSuggestions(query, parseInt(limit));

    res.json({
      success: true,
      query,
      suggestions,
      count: suggestions.length
    });

  } catch (error) {
    console.error('❌ Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting search suggestions',
      suggestions: []
    });
  }
});

/**
 * GET /api/search/filters
 * Get available filter options for search
 */
router.get('/filters', async (req, res) => {
  try {
    const { Download } = require('../models');
    const { Op } = require('sequelize');

    // Get available categories
    const categories = await Download.findAll({
      attributes: ['category', [Download.sequelize.fn('COUNT', '*'), 'count']],
      where: {
        category: { [Op.ne]: null }
      },
      group: ['category'],
      order: [[Download.sequelize.fn('COUNT', '*'), 'DESC']],
      raw: true
    });

    // Get available sources
    const sources = await Download.findAll({
      attributes: ['source', [Download.sequelize.fn('COUNT', '*'), 'count']],
      where: {
        source: { [Op.ne]: null }
      },
      group: ['source'],
      order: [[Download.sequelize.fn('COUNT', '*'), 'DESC']],
      raw: true
    });

    // Get top channels
    const channels = await Download.findAll({
      attributes: ['channelName', [Download.sequelize.fn('COUNT', '*'), 'count']],
      where: {
        channelName: { [Op.ne]: null }
      },
      group: ['channelName'],
      order: [[Download.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 20,
      raw: true
    });

    // Get date range
    const dateRange = await Download.findAll({
      attributes: [
        [Download.sequelize.fn('MIN', Download.sequelize.col('downloadedAt')), 'earliest'],
        [Download.sequelize.fn('MAX', Download.sequelize.col('downloadedAt')), 'latest']
      ],
      raw: true
    });

    res.json({
      success: true,
      filters: {
        categories: categories.map(cat => ({
          value: cat.category,
          label: cat.category,
          count: parseInt(cat.count)
        })),
        sources: sources.map(src => ({
          value: src.source,
          label: src.source,
          count: parseInt(src.count)
        })),
        channels: channels.map(ch => ({
          value: ch.channelName,
          label: ch.channelName,
          count: parseInt(ch.count)
        })),
        dateRange: {
          earliest: dateRange[0]?.earliest,
          latest: dateRange[0]?.latest
        },
        sortOptions: [
          { value: 'relevance', label: 'Relevance' },
          { value: 'downloadedAt', label: 'Download Date' },
          { value: 'title', label: 'Title' },
          { value: 'channelName', label: 'Channel Name' },
          { value: 'duration', label: 'Duration' },
          { value: 'fileSize', label: 'File Size' }
        ]
      }
    });

  } catch (error) {
    console.error('❌ Filters error:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting filter options'
    });
  }
});

/**
 * GET /api/search/stats
 * Get search and database statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { Download } = require('../models');

    const stats = await Download.findAll({
      attributes: [
        [Download.sequelize.fn('COUNT', '*'), 'totalVideos'],
        [Download.sequelize.fn('COUNT', Download.sequelize.fn('DISTINCT', Download.sequelize.col('channelName'))), 'totalChannels'],
        [Download.sequelize.fn('SUM', Download.sequelize.col('fileSize')), 'totalSize'],
        [Download.sequelize.fn('SUM', Download.sequelize.col('duration')), 'totalDuration']
      ],
      raw: true
    });

    const categoryStats = await Download.findAll({
      attributes: ['category', [Download.sequelize.fn('COUNT', '*'), 'count']],
      group: ['category'],
      order: [[Download.sequelize.fn('COUNT', '*'), 'DESC']],
      raw: true
    });

    const recentStats = await Download.findAll({
      attributes: [
        [Download.sequelize.fn('COUNT', '*'), 'recentCount']
      ],
      where: {
        downloadedAt: {
          [Download.sequelize.Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      raw: true
    });

    res.json({
      success: true,
      stats: {
        totalVideos: parseInt(stats[0]?.totalVideos || 0),
        totalChannels: parseInt(stats[0]?.totalChannels || 0),
        totalSize: parseInt(stats[0]?.totalSize || 0),
        totalDuration: parseInt(stats[0]?.totalDuration || 0),
        recentVideos: parseInt(recentStats[0]?.recentCount || 0),
        categories: categoryStats.map(cat => ({
          category: cat.category,
          count: parseInt(cat.count)
        }))
      }
    });

  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting search statistics'
    });
  }
});

module.exports = router;
