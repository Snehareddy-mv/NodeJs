const express = require("express");
const router = express.Router();
const channelController = require("../controllers/channelController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

/**
 * @swagger
 * /api/channels:
 *   post:
 *     summary: Create a new channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Channel created successfully
 */
router.post("/", channelController.createChannel);

/**
 * @swagger
 * /api/channels:
 *   get:
 *     summary: Get all channels
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Channels fetched successfully
 */
router.get("/", channelController.getAllChannels);

/**
 * @swagger
 * /api/channels/join-with-code:
 *   post:
 *     summary: Join a channel using an invite code
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inviteCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Joined channel successfully
 */
router.post("/join-with-code", channelController.joinWithInviteCode);

/**
 * @swagger
 * /api/channels/{id}:
 *   get:
 *     summary: Get channel by ID
 *     tags: [Channels]
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
 *         description: Channel fetched successfully
 */
router.get("/:id", channelController.getChannelById);

/**
 * @swagger
 * /api/channels/{id}:
 *   put:
 *     summary: Update channel
 *     tags: [Channels]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Channel updated successfully
 */
router.put("/:id", channelController.updateChannel);

/**
 * @swagger
 * /api/channels/{id}:
 *   delete:
 *     summary: Delete channel
 *     tags: [Channels]
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
 *         description: Channel deleted successfully
 */
router.delete("/:id", channelController.deleteChannel);

/**
 * @swagger
 * /api/channels/{id}/members:
 *   post:
 *     summary: Add member to channel
 *     tags: [Channels]
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
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Member added successfully
 */
router.post("/:id/members", channelController.addMemberToChannel);

/**
 * @swagger
 * /api/channels/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from channel
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Member removed successfully
 */
router.delete("/:id/members/:userId", channelController.removeMemberFromChannel);

/**
 * @swagger
 * /api/channels/{id}/invite-code:
 *   post:
 *     summary: Create an invite code for the channel (admin only)
 *     tags: [Channels]
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
 *         description: Invite code created successfully
 */
router.post("/:id/invite-code", channelController.createInviteCode);

/**
 * @swagger
 * /api/channels/{id}/invite:
 *   post:
 *     summary: Invite a user to the channel (admin/moderator only)
 *     tags: [Channels]
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
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User invited successfully
 */
router.post("/:id/invite", channelController.inviteUserToChannel);

/**
 * @swagger
 * /api/channels/{id}/accept-invite:
 *   post:
 *     summary: Accept a pending invite to the channel
 *     tags: [Channels]
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
 *         description: Invite accepted successfully
 */
router.post("/:id/accept-invite", channelController.acceptInvite);

/**
 * @swagger
 * /api/channels/{id}/promote-moderator:
 *   post:
 *     summary: Promote a user to moderator (admin only)
 *     tags: [Channels]
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
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User promoted to moderator successfully
 */
router.post("/:id/promote-moderator", channelController.promoteToModerator);

/**
 * @swagger
 * /api/channels/{id}/promote-admin:
 *   post:
 *     summary: Promote a user to admin (admin only)
 *     tags: [Channels]
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
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User promoted to admin successfully
 */
router.post("/:id/promote-admin", channelController.promoteToAdmin);

/**
 * @swagger
 * /api/channels/{id}/demote:
 *   post:
 *     summary: Demote a user from admin/moderator (admin only)
 *     tags: [Channels]
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
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User demoted successfully
 */
router.post("/:id/demote", channelController.demoteUser);

module.exports = router;
