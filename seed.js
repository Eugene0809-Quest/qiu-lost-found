// seed.js — Run this ONCE to insert demo users and items
// Usage: node seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db     = require('./db');

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // ── USERS ──────────────────────────────────────────────
    // Password for all demo accounts: Demo@1234
    const hash = await bcrypt.hash('Demo@1234', 12);

    const users = [
      { name: 'Ching Li Xuan',    email: 'lixuan.ching@qiu.edu.my' },
      { name: 'Lim Shao Qian',     email: 'shaoqian.lim@qiu.edu.my' },
      { name: 'Lim Kai Xi',    email: 'kaixi.lim@qiu.edu.my' },
    ];

    const userIds = [];
    for (const u of users) {
      // Skip if already exists
      const [existing] = await db.execute(
        'SELECT id FROM users WHERE email = ?', [u.email]
      );
      if (existing.length > 0) {
        console.log(`  ⚠️  User ${u.email} already exists — skipping`);
        userIds.push(existing[0].id);
        continue;
      }
      const [result] = await db.execute(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [u.name, u.email, hash]
      );
      userIds.push(result.insertId);
      console.log(`  ✅ Created user: ${u.name} (${u.email})`);
    }

    // ── LOST ITEMS ─────────────────────────────────────────
    const lostItems = [
      {
        user_id:       userIds[0],
        type:          'lost',
        title:         'Black Casio Scientific Calculator',
        description:   'Black Casio FX-570EX scientific calculator. Has a small scratch on the bottom right corner and my name written in marker on the back: "Ahmad R". Used for Engineering Mathematics.',
        category:      'Electronics',
        location:      'Block A, Level 2 — Engineering Lab (Room A2-05)',
        date_occurred: '2026-03-05',
        time_occurred: '14:30',
        contact_name:  'Ahmad Razif',
        contact_email: 'ahmad@qiu.edu.my',
        contact_phone: '+60 12-345 6789',
        status:        'active',
      },
      {
        user_id:       userIds[1],
        type:          'lost',
        title:         'Student ID Card — Priya Nair',
        description:   'QIU Student ID card. Name: Priya Nair, Student ID: QIU2023-0142. The card has a small crack on the top-left corner. Needed urgently for exam entry.',
        category:      'ID & Cards',
        location:      'Student Cafeteria, Ground Floor Block B',
        date_occurred: '2026-03-06',
        time_occurred: '12:15',
        contact_name:  'Priya Nair',
        contact_email: 'priya@qiu.edu.my',
        contact_phone: '+60 16-789 0123',
        status:        'active',
      },
      {
        user_id:       userIds[2],
        type:          'lost',
        title:         'Blue Nike Drawstring Bag',
        description:   'Medium-sized navy blue Nike drawstring bag. Contains a white gym towel and a yellow water bottle (Tupperware brand). May have been left in the changing room.',
        category:      'Bags',
        location:      'Sports Complex — Male Changing Room',
        date_occurred: '2026-03-04',
        time_occurred: '17:00',
        contact_name:  'Wei Jie Lim',
        contact_email: 'weijie@qiu.edu.my',
        contact_phone: null,
        status:        'active',
      },
    ];

    // ── FOUND ITEMS ────────────────────────────────────────
    const foundItems = [
      {
        user_id:       userIds[2],
        type:          'found',
        title:         'Silver Car Key with QIU Lanyard',
        description:   'Found a silver car key attached to a QIU-branded lanyard. The key fob has a Perodua logo. Found near the main entrance of the library. Currently kept at the security office.',
        category:      'Keys',
        location:      'Main Library Entrance, Block C',
        date_occurred: '2026-03-06',
        time_occurred: '09:45',
        contact_name:  'Wei Jie Lim',
        contact_email: 'weijie@qiu.edu.my',
        contact_phone: null,
        status:        'active',
      },
      {
        user_id:       userIds[0],
        type:          'found',
        title:         'Black Umbrella — Foldable',
        description:   'Small foldable black umbrella found on one of the chairs in Lecture Hall D (Room D1-08) after the 10am class. Has a gold-coloured handle. Owner can contact me or collect from security.',
        category:      'Accessories',
        location:      'Lecture Hall D, Room D1-08',
        date_occurred: '2026-03-05',
        time_occurred: '11:00',
        contact_name:  'Ahmad Razif',
        contact_email: 'ahmad@qiu.edu.my',
        contact_phone: '+60 12-345 6789',
        status:        'active',
      },
      {
        user_id:       userIds[1],
        type:          'found',
        title:         'Purple Notebook with Stickers',
        description:   'Found a purple hardcover notebook, A5 size, decorated with various stickers on the front cover. Contains handwritten notes — looks like Biology or Chemistry notes. Found in the library study area.',
        category:      'Books & Stationery',
        location:      'Library — 2nd Floor Study Area, Table near Window',
        date_occurred: '2026-03-07',
        time_occurred: '16:30',
        contact_name:  'Priya Nair',
        contact_email: 'priya@qiu.edu.my',
        contact_phone: '+60 16-789 0123',
        status:        'active',
      },
    ];

    const allItems = [...lostItems, ...foundItems];
    for (const item of allItems) {
      const [r] = await db.execute(
        `INSERT INTO items
          (user_id, type, title, description, category, location,
           date_occurred, time_occurred, contact_name, contact_email, contact_phone, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [item.user_id, item.type, item.title, item.description, item.category,
         item.location, item.date_occurred, item.time_occurred,
         item.contact_name, item.contact_email, item.contact_phone, item.status]
      );
      console.log(`  ✅ Created ${item.type} item: "${item.title}"`);
    }

    console.log('\n✅ Seed complete!');
    console.log('\n📋 Demo Login Accounts:');
    console.log('   Email: lixuan.ching@qiu.edu.my   | Password: demo1234');
    console.log('   Email: shaoqian.lim@qiu.edu.my   | Password: demo1234');
    console.log('   Email: kaixi.lim@qiu.edu.my      | Password: demo1234');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
