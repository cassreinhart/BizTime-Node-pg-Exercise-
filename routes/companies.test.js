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
                VALUES ('apple', 100, false, '2018-01-01', null),
                        ('apple', 200, true, '2018-02-01', '2018-02-02'), 
                        ('ibm', 300, false, '2018-03-01', null)
                RETURNING id`);
    }
);

afterAll(async () => {
    await db.end()
});

describe('GET /', function () {
    it('responds with list of companies', async () => {
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ companies: [
            {code: "apple", name: "Apple"},
            {code: "ibm", name: "IBM"},]})
    })
});

describe("GET /ibm", function () {

    it("should respond with info about a company", async () => {
        const res = await request(app).get("/companies/ibm");
        expect(res.body).toEqual({
            "company": {
                code: "ibm",
                name: "IBM",
                description: "Big blue.",
                invoices: [3],
            }
        });
    });
  
    it("should respond w/404 for invalid company", async () => {
        const res = await request(app).get("/companies/asdfgas");
        expect(res.statusCode).toEqual(404);
    })
});

describe("POST /", function () {

    it("should return created company", async () => {
        const res = await request(app).post("/companies").send(
            {name: 'Microsoft', description: 'American multinational technology corporation.'}
        );
        expect(res.body).toEqual({
            "company": {
                code: "microsoft",
                name: "Microsoft",
                description: "American multinational technology corporation."
            }
        });
    });
});