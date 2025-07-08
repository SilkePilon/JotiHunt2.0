const express = require('express');
const { assignArticle, updateAssignment, getUserAssignments } = require('../services/sqliteService');
const { cacheMiddleware, clearCache } = require('../middleware/cacheMiddleware');
const { logger } = require('../utils/logger');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { articleId, userName, status = 'Assigned' } = req.body;
    
    if (!articleId || !userName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: articleId and userName'
      });
    }

    if (!Number.isInteger(articleId) || articleId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'articleId must be a positive integer'
      });
    }

    if (typeof userName !== 'string' || userName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'userName must be a string with at least 2 characters'
      });
    }

    const validStatuses = ['Assigned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'status must be one of: ' + validStatuses.join(', ')
      });
    }

    await assignArticle(articleId, userName.trim(), status);
    
    clearCache('/api/assignments');
    
    res.status(201).json({
      success: true,
      message: 'Article assigned successfully',
      data: {
        articleId,
        userName: userName.trim(),
        status
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error assigning article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign article',
      message: error.message
    });
  }
});

router.put('/:articleId/:userName', async (req, res) => {
  try {
    const { articleId, userName } = req.params;
    const { status, pointsEarned, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: status'
      });
    }

    const validStatuses = ['Assigned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'status must be one of: ' + validStatuses.join(', ')
      });
    }

    if (pointsEarned !== undefined && (!Number.isInteger(pointsEarned) || pointsEarned < 0)) {
      return res.status(400).json({
        success: false,
        error: 'pointsEarned must be a non-negative integer'
      });
    }

    await updateAssignment(parseInt(articleId), userName, status, pointsEarned, notes);
    
    clearCache('/api/assignments');
    
    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: {
        articleId: parseInt(articleId),
        userName,
        status,
        pointsEarned,
        notes
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error updating assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update assignment',
      message: error.message
    });
  }
});

router.get('/user/:userName', cacheMiddleware(60), async (req, res) => {
  try {
    const { userName } = req.params;
    const assignments = await getUserAssignments(userName);
    
    const stats = {
      total: assignments.length,
      completed: assignments.filter(a => a.status === 'Completed').length,
      inProgress: assignments.filter(a => a.status === 'In Progress').length,
      assigned: assignments.filter(a => a.status === 'Assigned').length,
      totalPoints: assignments.reduce((sum, a) => sum + (a.points_earned || 0), 0)
    };
    
    res.json({
      success: true,
      data: {
        assignments,
        stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting user assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user assignments',
      message: error.message
    });
  }
});

router.get('/stats', cacheMiddleware(300), async (req, res) => {
  try {
    // This would require a new function in sqliteService to get all assignments stats
    // For now, return a placeholder
    res.json({
      success: true,
      message: 'Assignment statistics endpoint - to be implemented',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error getting assignment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assignment stats',
      message: error.message
    });
  }
});

module.exports = router;
