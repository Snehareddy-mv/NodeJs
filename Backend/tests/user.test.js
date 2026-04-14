const request = require("supertest");
const app = require("../app");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

let adminUser;
let adminToken;

// Setup before tests
beforeAll(async () => {
  // Create admin user
  const admin = await User.create({
    name: "Admin",
    email: "admin@test.com",
    password: "hashedpassword",
    role: "admin"
  });

  adminUser = {
    id: admin._id.toString(),
    role: "admin"
  };

  // Generate real JWT token
  adminToken = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
});

// Clean DB after each test
afterEach(async () => {
  await User.deleteMany({ email: { $ne: "admin@test.com" } });
});

describe("User API Tests", () => {

  // ✅ GET ALL USERS (Pagination)
  describe("GET /api/users/all-users", () => {
    it("should return paginated users", async () => {
      await User.create([
        { name: "User1", email: "u1@gmail.com", password: "123", role: "user" },
        { name: "User2", email: "u2@gmail.com", password: "123", role: "user" },
      ]);

      const res = await request(app)
        .get("/api/users/all-users?page=1&limit=2")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.users).toBeDefined();
      expect(res.body.page).toBe(1);
    });

    it("should return 403 if not admin", async () => {
      const userToken = jwt.sign(
        { id: "123", role: "user" },
        process.env.JWT_SECRET
      );

      const res = await request(app)
        .get("/api/users/all-users")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  // ✅ GET SINGLE USER
  describe("GET /api/users/single-user/:id", () => {
    it("should fetch a user", async () => {
      const user = await User.create({
        name: "Test",
        email: "test@gmail.com",
        password: "123",
      });

      const res = await request(app).get(`/api/users/single-user/${user._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe("test@gmail.com");
    });
  });

  // ✅ UPDATE USER
  describe("PUT /api/users/update-user/:id", () => {
    it("should update user", async () => {
      const user = await User.create({
        name: "Old",
        email: "old@gmail.com",
        password: "123",
      });

      const res = await request(app)
        .put(`/api/users/update-user/${user._id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "New Name" });

      expect(res.statusCode).toBe(200);
      expect(res.body.user.name).toBe("New Name");
    });

    it("should deny role update for non-admin", async () => {
      const user = await User.create({
        name: "Test",
        email: "test@gmail.com",
        password: "123",
      });

      const userToken = jwt.sign(
        { id: user._id, role: "user" },
        process.env.JWT_SECRET
      );

      const res = await request(app)
        .put(`/api/users/update-user/${user._id}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ role: "admin" });

      expect(res.statusCode).toBe(403);
    });
  });

  // ✅ DELETE USER
  describe("DELETE /api/users/delete-user/:id", () => {
    it("should delete user", async () => {
      const user = await User.create({
        name: "Delete",
        email: "delete@gmail.com",
        password: "123",
      });

      const res = await request(app)
        .delete(`/api/users/delete-user/${user._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
    });

    it("should not delete own account", async () => {
      const res = await request(app)
        .delete(`/api/users/delete-user/${adminUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
    });
  });

  // ✅ REFRESH TOKEN
  describe("POST /api/users/refresh-token", () => {
    it("should fail if no token", async () => {
      const res = await request(app)
        .post("/api/users/refresh-token")
        .send({});

      expect(res.statusCode).toBe(400); // Validation error
    });

    it("should return new access token", async () => {
      const user = await User.create({
        name: "Test",
        email: "refresh@gmail.com",
        password: "123",
      });

      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET
      );

      user.refreshToken = token;
      await user.save();

      const res = await request(app)
        .post("/api/users/refresh-token")
        .send({ refreshToken: token });

      expect(res.statusCode).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });
  });

  // ✅ PROFILE PICTURE
  describe("POST /api/users/upload-picture", () => {
    it("should fail if no file uploaded", async () => {
      const res = await request(app)
        .post("/api/users/upload-picture")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

});