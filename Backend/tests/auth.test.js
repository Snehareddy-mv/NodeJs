const request = require("supertest");
const app = require("../app");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");

describe("Auth API Tests", () => {

  // ✅ REGISTER TESTS
  describe("POST /api/auth/register", () => {
    
    it("should register a new user with valid data", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "Password123",
          role: "user"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User registered successfully");

      // Verify user was created in database
      const user = await User.findOne({ email: "john@example.com" });
      expect(user).toBeDefined();
      expect(user.name).toBe("John Doe");
      expect(user.role).toBe("user");
    });

    it("should register admin user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Admin User",
          email: "admin@example.com",
          password: "Admin123",
          role: "admin"
        });

      expect(res.statusCode).toBe(201);
      
      const user = await User.findOne({ email: "admin@example.com" });
      expect(user.role).toBe("admin");
    });

    it("should fail with duplicate email", async () => {
      // Register first user
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "Password123",
          role: "user"
        });

      // Try to register with same email
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Jane Doe",
          email: "john@example.com",
          password: "Password456",
          role: "user"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should fail with invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "notanemail",
          password: "Password123",
          role: "user"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Validation Failed");
    });

    it("should fail with weak password (less than 6 characters)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "weak",
          role: "user"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Validation Failed");
    });

    it("should fail with password without uppercase", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          role: "user"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Validation Failed");
    });

    it("should fail with password without lowercase", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "PASSWORD123",
          role: "user"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Validation Failed");
    });

    it("should fail with password without number", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "Password",
          role: "user"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Validation Failed");
    });

    it("should fail with missing name", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "john@example.com",
          password: "Password123",
          role: "user"
        });

      expect(res.statusCode).toBe(400);
    });

    it("should fail with short name (less than 3 characters)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Jo",
          email: "john@example.com",
          password: "Password123",
          role: "user"
        });

      expect(res.statusCode).toBe(400);
    });

    it("should fail with invalid role", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "Password123",
          role: "superadmin"
        });

      expect(res.statusCode).toBe(400);
    });

    it("should hash password before saving", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "Password123",
          role: "user"
        });

      const user = await User.findOne({ email: "john@example.com" });
      expect(user.password).not.toBe("Password123");
      
      // Verify password is hashed
      const isMatch = await bcrypt.compare("Password123", user.password);
      expect(isMatch).toBe(true);
    });
  });

  // ✅ LOGIN TESTS
  describe("POST /api/auth/login", () => {
    
    beforeEach(async () => {
      // Register a user before each login test
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "John Doe",
          email: "john@example.com",
          password: "Password123",
          role: "user"
        });
    });

    it("should login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "Password123"
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Login successfull");
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("john@example.com");
      expect(res.body.user.name).toBe("John Doe");
    });

    it("should return user details without password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "Password123"
        });

      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.id).toBeDefined();
      expect(res.body.user.role).toBeDefined();
    });

    it("should save refresh token in database", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "Password123"
        });

      const user = await User.findOne({ email: "john@example.com" });
      expect(user.refreshToken).toBe(res.body.refreshToken);
    });

    it("should fail with wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "WrongPassword123"
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should fail with non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "Password123"
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("should fail with invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "notanemail",
          password: "Password123"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe("Validation Failed");
    });

    it("should fail with missing email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          password: "Password123"
        });

      expect(res.statusCode).toBe(400);
    });

    it("should fail with missing password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com"
        });

      expect(res.statusCode).toBe(400);
    });

    it("should fail with empty credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it("should generate different tokens for multiple logins", async () => {
      const res1 = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "Password123"
        });

      expect(res1.statusCode).toBe(200);
      expect(res1.body.accessToken).toBeDefined();
      expect(res1.body.refreshToken).toBeDefined();

      // Wait 1 second to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));

      const res2 = await request(app)
        .post("/api/auth/login")
        .send({
          email: "john@example.com",
          password: "Password123"
        });

      expect(res2.statusCode).toBe(200);
      expect(res2.body.accessToken).toBeDefined();
      expect(res2.body.refreshToken).toBeDefined();

      expect(res1.body.accessToken).not.toBe(res2.body.accessToken);
      expect(res1.body.refreshToken).not.toBe(res2.body.refreshToken);
    });
  });

});