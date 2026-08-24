const request = require("supertest");
const { expect } = require("chai");
const app = require("../app"); // apna Express app import karo

describe("JWT Auth API", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/auth/register")
      .send({ username: "testuser", email: "test@mail.com", password: "123456" });
    expect(res.status).to.equal(200);
  });

  it("should login and return JWT", async () => {
    const res = await request(app).post("/auth/login")
      .send({ email: "test@mail.com", password: "123456" });
    expect(res.body).to.have.property("token");
  });

  it("should access profile with valid JWT", async () => {
    const tokenRes = await request(app).post("/auth/login")
      .send({ email: "test@mail.com", password: "123456" });
    const token = tokenRes.body.token;

    const res = await request(app).get("/auth/profile")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).to.equal(200);
  });
});
