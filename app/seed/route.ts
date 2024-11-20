import bcrypt from 'bcrypt';
import { db } from '@vercel/postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const client = await db.connect();

async function seedUsers() {
  try {
    console.log("Creating 'users' table...");
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `;
    console.log("'users' table created successfully.");

    console.log("Seeding 'users' data...");
    const insertedUsers = await Promise.all(
      users.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return client.sql`
          INSERT INTO users (id, name, email, password)
          VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
          ON CONFLICT (id) DO NOTHING;
        `;
      })
    );
    console.log("Users seeded successfully.");
    return insertedUsers;
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
}

async function seedCustomers() {
  try {
    console.log("Creating 'customers' table...");
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await client.sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      );
    `;
    console.log("'customers' table created successfully.");

    console.log("Seeding 'customers' data...");
    const insertedCustomers = await Promise.all(
      customers.map((customer) =>
        client.sql`
          INSERT INTO customers (id, name, email, image_url)
          VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
          ON CONFLICT (id) DO NOTHING;
        `
      )
    );
    console.log("Customers seeded successfully.");
    return insertedCustomers;
  } catch (error) {
    console.error("Error seeding customers:", error);
    throw error;
  }
}

async function seedInvoices() {
  try {
    console.log("Creating 'invoices' table...");
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await client.sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        customer_id UUID NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      );
    `;
    console.log("'invoices' table created successfully.");

    console.log("Seeding 'invoices' data...");
    const insertedInvoices = await Promise.all(
      invoices.map((invoice) =>
        client.sql`
          INSERT INTO invoices (customer_id, amount, status, date)
          VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
          ON CONFLICT (id) DO NOTHING;
        `
      )
    );
    console.log("Invoices seeded successfully.");
    return insertedInvoices;
  } catch (error) {
    console.error("Error seeding invoices:", error);
    throw error;
  }
}

async function seedRevenue() {
  try {
    console.log("Creating 'revenue' table...");
    await client.sql`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `;
    console.log("'revenue' table created successfully.");

    console.log("Seeding 'revenue' data...");
    const insertedRevenue = await Promise.all(
      revenue.map((rev) =>
        client.sql`
          INSERT INTO revenue (month, revenue)
          VALUES (${rev.month}, ${rev.revenue})
          ON CONFLICT (month) DO NOTHING;
        `
      )
    );
    console.log("Revenue seeded successfully.");
    return insertedRevenue;
  } catch (error) {
    console.error("Error seeding revenue:", error);
    throw error;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function GET() {
  try {
    console.log("Starting database seeding...");
    await client.sql`BEGIN`;

    await seedUsers();
    await seedCustomers();
    await seedInvoices();
    await seedRevenue();

    await client.sql`COMMIT`;
    console.log("Database seeded successfully.");
    return new Response(JSON.stringify({ message: 'Database seeded successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error during database seeding:", error);
    await client.sql`ROLLBACK`;

    const errorMessage = getErrorMessage(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}