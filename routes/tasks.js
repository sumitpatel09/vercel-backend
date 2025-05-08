// routes/task.js
const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const roleAuthorization = require('../middleware/role');

// Fetch task summary
router.get('/summary', protect, async (req, res) => {
  try {
    console.log('Fetching summary...');
    const total = await Task.countDocuments();
    const assigned = await Task.countDocuments({ assignedTo: { $ne: null } });
    const completed = await Task.countDocuments({ status: 'Completed' });
    const pending = await Task.countDocuments({ status: 'Pending' });

    res.json({ total, assigned, completed, pending });
  } catch (err) {
    console.error('Error fetching task summary:', err.message);
    res.status(500).json({ error: err.message });
  }
});


router.get('/tasklist', protect, async (req, res) => {
  try {
    let { status } = req.query;
    const userId = req.user._id;

    let query = {};

    if (status === 'Pending Task') {
      query.status = 'Pending';
    } else if (status === 'Complete Tasks') {
      query.status = 'Completed';
    } else if (status === 'Assigned Tasks') {
      query.assignedTo = userId; // assuming 'assignedTo' is the field for task assignment
    } else {
      return res.status(400).json({ message: 'Invalid status filter.' });
    }

    const tasks = await Task.find(query);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a task
router.post('/', protect, roleAuthorization(['admin', 'manager', 'user']), async (req, res) => {
  const { title, description, dueDate, priority, status, assignedTo } = req.body;
  try {
    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      status,
      createdBy: req.user._id,
      assignedTo,
    });
    await task.save();

    // Create notification if assignedTo is set and different from creator
    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        user: assignedTo,
        message: `A new task "${title}" has been assigned to you.`,
      });
      await notification.save();

      // Emit real-time notification via Socket.io
      req.io.to(assignedTo.toString()).emit('notification', {
        message: `A new task "${title}" has been assigned to you.`,
      });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get tasks assigned to or created by user, with optional filters and search
router.get('/', protect, async (req, res) => {
  const { status, priority, dueDate, search } = req.query;
  try {
    const query = {
      $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }],
    };

    // Case-insensitive match for status
    if (status) {
      query.status = new RegExp(`^${status}$`, 'i');
    }
    if (priority) {
      query.priority = priority;
    }
    if (dueDate) {
      query.dueDate = { $lte: new Date(dueDate) };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    console.log('Query:', query);

    const tasks = await Task.find(query)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .sort({ dueDate: 1 });

      console.log('Fetched tasks:', tasks);

      if (!tasks || tasks.length === 0) {
        return res.status(404).json({ message: 'No tasks found' });
      }
  
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);  // Log any errors that occur
      res.status(500).json({ message: error.message });
    }
  });

// Get a single task by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is creator or assignee
    if (
      task.createdBy._id.toString() !== req.user._id.toString() &&
      (!task.assignedTo || task.assignedTo._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only creator or assignee can update
    if (
      task.createdBy.toString() !== req.user._id.toString() &&
      (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const { title, description, dueDate, priority, status, assignedTo } = req.body;

    task.title = title || task.title;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    task.priority = priority || task.priority;
    task.status = status || task.status;

    // If assignedTo changed, create notification
    if (assignedTo && assignedTo.toString() !== task.assignedTo?.toString()) {
      task.assignedTo = assignedTo;
      if (assignedTo.toString() !== req.user._id.toString()) {
        const notification = new Notification({
          user: assignedTo,
          message: `A task "${task.title}" has been assigned to you.`,
        });
        await notification.save();

        // Emit real-time notification via Socket.io
        req.io.to(assignedTo.toString()).emit('notification', {
          message: `A task "${task.title}" has been assigned to you.`,
        });
      }
    }

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a task
router.delete('/:id', protect, roleAuthorization(['admin', 'manager', 'user']), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only creator or admin can delete
    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id); // ✅ safer than task.remove()
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
