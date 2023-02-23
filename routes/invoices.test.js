const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeEach(
    async function createData() {
        //clear out tables
        await db.query("DELETE FROM invoices");
        await db.query("DELETE FROM companies");


        await db.query("SELECT setval('invoices_id_seq', 1, false)");
        await db.query(`INSERT INTO companies (code, name, description)
                    VALUES ('apple', 'Apple', 'Maker of OSX.'),
                           ('ibm', 'IBM', 'Big blue.')`);

        const inv = await db.query(
            `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
               VALUES ('apple', 100, false, '2023-01-01', null),
                      ('apple', 200, true, '2023-02-01', '2023-02-08'), 
                      ('ibm', 300, false, '2023-02-21', null)
               RETURNING id`);
    }
);

afterAll(async () => {
    await db.end()
})

//////////// tests

describe("GET /", () => {

    it("should respond with array of invoices", async () => {
        const res = await request(app).get("/invoices");
        expect(res.body).toEqual({
            "invoices": [
                {id: 1, comp_code: "apple"},
                {id: 2, comp_code: "apple"},
                {id: 3, comp_code: "ibm"},
            ]
        });
    })
});


describe("GET /1", () => {

    it("return invoice info", async () => {
        const res = await request(app).get("/invoices/1");
        expect(res.body).toEqual({
            "invoice": {
                id: 1,
                amt: 100,
                add_date: '2023-01-01T08:00:00.000Z',
                paid: false,
                paid_date: null,
                company: {
                    code: 'apple',
                    name: 'Apple',
                    description: 'Maker of OSX.',
                }
            }
        });
    });

    it("should return 404 for invalid invoice", async () => {
    const res = await request(app).get("/invoices/251461");
    expect(res.status).toEqual(404);
    })
});


describe("POST /", () => {

    it("should add invoice", async () => {
        const res = await request(app).post("/invoices").send({amt: 200, comp_code: 'apple'});
        expect(res.body).toEqual({
            "invoice": {
                id: 4,
                comp_code: "apple",
                amt: 200,
                add_date: expect.any(String),
                paid: false,
                paid_date: null,
            }
        });
    });
});


describe("PUT /", () => {

    it("should update an invoice", async () => {
        const res = await request(app).put("/invoices/1").send({amt: 750, paid: false});
        expect(res.body).toEqual({
            "invoice": {
                id: 1,
                comp_code: 'apple',
                paid: false,
                amt: 750,
                add_date: expect.any(String),
                paid_date: null,
            }
        });
    });

    it("should return 404 for invalid invoice", async () => {
        const res = await request(app).put("/invoices/153285").send({amt: 1});
        expect(res.status).toEqual(404);
    });

    it("should return 500 for missing data", async () => {
        const res = await request(app).put("/invoices/1").send({});
        expect(res.status).toEqual(500);
    })
});
  
  
describe("DELETE /", () => {

    it("should delete invoice", async () => {
        const res = await request(app).delete("/invoices/1");
        expect(res.body).toEqual({"status": "deleted"});
    });

    it("should return 404 for invalid invoices", async () => {
        const res = await request(app).delete("/invoices/123515");
        expect(res.status).toEqual(404);
    });
});