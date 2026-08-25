const request = require("supertest");
const { expect } = require("chai");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const app = require("../app");

const unique = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

describe("JWT Auth API", () => {
  it("registers a new user successfully", async () => {
    const username = unique("alice");
    const email = `${username}@example.com`;

    const res = await request(app)
      .post("/auth/register")
      .send({ username, email, password: "123456" });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("userId");
  });

  it("rejects registration without a username", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: `${unique("no-username")}@example.com`, password: "123456" });

    expect(res.status).to.equal(400);
    expect(res.body.errors.some((err) => err.msg === "Username is required" && err.path === "username")).to.equal(true);
  });

  it("logs in and returns a JWT", async () => {
    const username = unique("bob");
    const email = `${username}@example.com`;

    await request(app)
      .post("/auth/register")
      .send({ username, email, password: "123456" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email, password: "123456" });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("token");
  });

  it("returns the profile for a valid JWT", async () => {
    const username = unique("charlie");
    const email = `${username}@example.com`;

    await request(app)
      .post("/auth/register")
      .send({ username, email, password: "123456" });

    const loginRes = await request(app)
      .post("/auth/login")
      .send({ email, password: "123456" });

    const profileRes = await request(app)
      .get("/auth/profile")
      .set("Authorization", `Bearer ${loginRes.body.token}`);

    expect(profileRes.status).to.equal(200);
    expect(profileRes.body.email).to.equal(email);
    expect(profileRes.body.username).to.equal(username);
  });
});
