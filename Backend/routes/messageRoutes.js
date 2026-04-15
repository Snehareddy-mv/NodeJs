const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               channelId:
 *                 type: string
 *               receiverId:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [text, file, image, ai]
 *               fileUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post("/", messageController.sendMessage);

/**
 * @swagger
 * /api/messages/search:
 *   get:
 *     summary: Search messages by content
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/search", messageController.searchMessages);

/**
 * @swagger
 * /api/messages/pinned/{channelId}:
 *   get:
 *     summary: Get all pinned messages in a channel
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pinned messages retrieved successfully
 */
router.get("/pinned/:channelId", messageController.getPinnedMessages);

/**
 * @swagger
 * /api/messages/channel/{channelId}:
 *   get:
 *     summary: Get channel messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 */
router.get("/channel/:channelId", messageController.getChannelMessages);

/**
 * @swagger
 * /api/messages/direct/{userId}:
 *   get:
 *     summary: Get direct messages with a user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Direct messages fetched successfully
 */
router.get("/direct/:userId", messageController.getDirectMessages);

/**
 * @swagger
 * /api/messages/ai:
 *   post:
 *     summary: Ask AI assistant
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *               channelId:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response generated successfully
 */
router.post("/ai", messageController.askAI);

/**
 * @swagger
 * /api/messages/summarize/{channelId}:
 *   get:
 *     summary: Summarize conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation summarized successfully
 */
router.get("/summarize/:channelId", messageController.summarizeConversation);

/**
 * @swagger
 * /api/messages/smart-reply/{messageId}:
 *   get:
 *     summary: Generate smart reply
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Smart reply generated successfully
 */
router.get("/smart-reply/:messageId", messageController.generateSmartReply);

/**
 * @swagger
 * /api/messages/{id}:
 *   delete:
 *     summary: Delete message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 */
router.delete("/:id", messageController.deleteMessage);

/**
 * @swagger
 * /api/messages/{id}:
 *   put:
 *     summary: Edit a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message updated successfully
 */
router.put("/:id", messageController.editMessage);

/**
 * @swagger
 * /api/messages/{id}/pin:
 *   post:
 *     summary: Pin a message (admin/moderator only)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message pinned successfully
 */
router.post("/:id/pin", messageController.pinMessage);

/**
 * @swagger
 * /api/messages/{id}/unpin:
 *   post:
 *     summary: Unpin a message (admin/moderator only)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message unpinned successfully
 */
router.post("/:id/unpin", messageController.unpinMessage);

module.exports = router;
