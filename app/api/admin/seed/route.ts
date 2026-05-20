import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { Company, Lead } from '@/models/CRM';
import { Activity } from '@/models/Activity';
import { Role } from '@/models/Role';
import { KanbanColumn, KanbanTask } from '@/models/Kanban';
import { Store } from '@/models/Store';
import { Product } from '@/models/Product';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/admin/seed:
 *   get:
 *     summary: Seed the database
 *     description: Clears existing collections (Users, Companies, Leads, Activities, Roles, KanbanColumns, KanbanTasks) and populates them with sample seed data.
 *     tags:
 *       - Database Seeding
 *     responses:
 *       200:
 *         description: Database seeded successfully with summary stats
 *       500:
 *         description: Seeding error
 */
export async function GET() {
  try {
    await connectToDatabase();

    // 1. Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      Lead.deleteMany({}),
      Activity.deleteMany({}),
      Role.deleteMany({}),
      KanbanColumn.deleteMany({}),
      KanbanTask.deleteMany({}),
      Store.deleteMany({}),
      Product.deleteMany({})
    ]);

    // 1.5 Create Roles
    const rolesData = [
      {
        name: 'Super Admin',
        permissions: {
          crm: ['read', 'write', 'delete'],
          users: ['read', 'write', 'delete'],
          analytics: ['read', 'write', 'delete'],
          media: ['read', 'write', 'delete'],
          settings: ['read', 'write', 'delete'],
        },
        isSystem: true
      },
      {
        name: 'Editor',
        permissions: {
          crm: ['read', 'write'],
          media: ['read', 'write'],
          users: ['read', 'write'],
          analytics: ['read'],
        },
        isSystem: false
      },
      {
        name: 'User',
        permissions: {
          crm: ['read'],
          analytics: ['read'],
        },
        isSystem: false
      },
    ];
    const createdRoles = await Role.insertMany(rolesData);
    const superAdminRole = createdRoles.find(r => r.name === 'Super Admin')?._id;
    const editorRole = createdRoles.find(r => r.name === 'Editor')?._id;
    const userRole = createdRoles.find(r => r.name === 'User')?._id;

    // 2. Create Users
    const defaultPassword = await bcrypt.hash('password123', 10);
    const usersData = [
      { name: 'Admin Demo', email: 'admin@example.com', password: defaultPassword, role: superAdminRole, status: 'Active' },
      { name: 'Jane Editor', email: 'jane@example.com', password: defaultPassword, role: editorRole, status: 'Active' },
      { name: 'John Doe', email: 'john@example.com', password: defaultPassword, role: userRole, status: 'Active' },
      { name: 'Sarah Smith', email: 'sarah@example.com', password: defaultPassword, role: userRole, status: 'Inactive' },
      { name: 'Michael Tech', email: 'michael@example.com', password: defaultPassword, role: editorRole, status: 'Active' },
    ];
    const createdUsers = await User.insertMany(usersData);
    const adminUser = createdUsers[0];

    // 3. Create Companies
    const companiesData = [
      { 
        name: 'Acme Corp', 
        industry: 'Technology', 
        size: '51-200', 
        website: 'https://acme.example.com', 
        address: '123 Industrial Pkwy, San Jose, CA' 
      },
      { 
        name: 'GlobalTech Industries', 
        industry: 'Manufacturing', 
        size: '500+', 
        website: 'https://globaltech.example.com', 
        address: '789 Manufacture Way, Detroit, MI' 
      },
      { 
        name: 'Stark Enterprises', 
        industry: 'Defense', 
        size: '500+', 
        website: 'https://stark.example.com', 
        address: '10880 Wilshire Blvd, Los Angeles, CA' 
      },
      { 
        name: 'Wayne Financial', 
        industry: 'Finance', 
        size: '500+', 
        website: 'https://wayne.example.com', 
        address: '1007 Mountain Drive, Gotham City, NJ' 
      },
      { 
        name: 'Cyberdyne Systems', 
        industry: 'AI & Robotics', 
        size: '51-200', 
        website: 'https://cyberdyne.example.com', 
        address: '18111 Nordhoff St, Northridge, CA' 
      },
    ];
    const createdCompanies = await Company.insertMany(companiesData);

    // 4. Create Leads
    const statuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    const priorities = ['Low', 'Medium', 'High'];
    const leadsData = [];

    // Helper to generate random dates within the last 30 days
    const randomDate = () => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      return date;
    };

    for (let i = 0; i < 25; i++) {
      const company = createdCompanies[Math.floor(Math.random() * createdCompanies.length)];
      leadsData.push({
        name: `Lead ${i + 1} - ${company.name}`,
        email: `contact${i}@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1-555-${Math.floor(1000 + Math.random() * 9000)}`,
        company: company._id,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        value: Math.floor(5000 + Math.random() * 95000), // Random value between 5k and 100k
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        assignedTo: createdUsers[Math.floor(Math.random() * createdUsers.length)]._id,
        lastContacted: randomDate(),
        createdAt: randomDate(),
      });
    }
    const createdLeads = await Lead.insertMany(leadsData);

    // 5. Create Activities
    const activitiesData = [];
    const activityTypes = ['Create', 'Update', 'Login', 'System'];
    const modules = ['Users', 'CRM', 'Media'];

    for (let i = 0; i < 40; i++) {
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const module = modules[Math.floor(Math.random() * modules.length)];
      const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      
      activitiesData.push({
        user: user._id,
        type: type,
        module: module,
        description: `User ${user.name} performed a ${type} action on ${module}`,
        createdAt: randomDate(),
      });
    }
    // Specific activity for a lead
    activitiesData.push({
      user: adminUser._id,
      type: 'Create',
      module: 'CRM',
      description: `Created new lead: ${createdLeads[0].name}`,
      metadata: { leadId: createdLeads[0]._id },
      createdAt: new Date(),
    });

    await Activity.insertMany(activitiesData);

    // 6. Create Kanban Board
    const kanbanColumns = [
      { key: 'todo', title: 'To Do', order: 0 },
      { key: 'in-progress', title: 'In Progress', order: 1 },
      { key: 'done', title: 'Done', order: 2 }
    ];
    await KanbanColumn.insertMany(kanbanColumns);

    const kanbanTasks = [
      { title: 'Design system audit', priority: 'High', category: 'Design', date: 'Oct 28', columnId: 'todo', order: 0 },
      { title: 'Update documentation', priority: 'Low', category: 'Docs', date: 'Oct 30', columnId: 'todo', order: 1 },
      { title: 'User authentication flow', priority: 'High', category: 'Dev', date: 'Oct 25', columnId: 'in-progress', order: 0 },
      { title: 'API performance optimization', priority: 'Medium', category: 'Dev', date: 'Oct 26', columnId: 'in-progress', order: 1 },
      { title: 'Implement dark mode', priority: 'High', category: 'UI', date: 'Oct 20', columnId: 'done', order: 0 },
      { title: 'Setup CI/CD pipeline', priority: 'Medium', category: 'Dev', date: 'Oct 22', columnId: 'done', order: 1 }
    ];
    await KanbanTask.insertMany(kanbanTasks);

    // 8. Create Marketplace Stores & Products
    const storesData = [
      { name: 'Toko Kelontong Berkah', owner: createdUsers[0]._id, description: 'Menyediakan berbagai kebutuhan pokok sehari-hari dengan harga terjangkau.', address: 'Jl. Merdeka No. 12, Bandung', phone: '081234567890', status: 'active', balance: 2500000 },
      { name: 'Warung Madura Jaya', owner: createdUsers[1]._id, description: 'Warung kelontong lengkap buka 24 jam, menyediakan sembako dan kebutuhan rumah tangga.', address: 'Jl. Pahlawan No. 45, Surabaya', phone: '082345678901', status: 'active', balance: 1800000 },
      { name: 'Mini Market Sejahtera', owner: createdUsers[2]._id, description: 'Mini market modern dengan produk berkualitas dan pelayanan ramah.', address: 'Jl. Sudirman No. 78, Jakarta', phone: '083456789012', status: 'active', balance: 3200000 },
    ];
    const createdStores = await Store.insertMany(storesData);

    const productsData = [
      // Store 1 - Toko Kelontong Berkah
      { storeId: createdStores[0]._id, name: 'Beras Premium 5kg', description: 'Beras putih premium kualitas terbaik dari padi pilihan.', price: 75000, stock: 50, category: 'Sembako', status: 'available' },
      { storeId: createdStores[0]._id, name: 'Minyak Goreng 2L', description: 'Minyak goreng sawit kemasan 2 liter, jernih dan sehat.', price: 36000, stock: 80, category: 'Sembako', status: 'available' },
      { storeId: createdStores[0]._id, name: 'Gula Pasir 1kg', description: 'Gula pasir putih kristal kemasan 1 kilogram.', price: 16000, stock: 100, category: 'Sembako', status: 'available' },
      { storeId: createdStores[0]._id, name: 'Kopi Kapal Api 165g', description: 'Kopi bubuk hitam legendaris, aroma dan rasa khas.', price: 12000, stock: 60, category: 'Minuman', status: 'available' },
      { storeId: createdStores[0]._id, name: 'Sabun Cuci Piring 800ml', description: 'Sabun cuci piring cair pembersih lemak membandel.', price: 14000, stock: 45, category: 'Kebutuhan Rumah', status: 'available' },
      // Store 2 - Warung Madura Jaya
      { storeId: createdStores[1]._id, name: 'Indomie Goreng (5 pcs)', description: 'Mi instan goreng favorit Indonesia, isi 5 bungkus.', price: 15000, stock: 200, category: 'Makanan', status: 'available' },
      { storeId: createdStores[1]._id, name: 'Teh Botol Sosro 450ml', description: 'Teh manis dalam kemasan botol, segar dan nikmat.', price: 5000, stock: 150, category: 'Minuman', status: 'available' },
      { storeId: createdStores[1]._id, name: 'Telur Ayam 1kg', description: 'Telur ayam negeri segar, sumber protein berkualitas.', price: 28000, stock: 40, category: 'Sembako', status: 'available' },
      { storeId: createdStores[1]._id, name: 'Deterjen Bubuk 900g', description: 'Deterjen bubuk wangi untuk cucian bersih dan harum.', price: 22000, stock: 35, category: 'Kebutuhan Rumah', status: 'available' },
      { storeId: createdStores[1]._id, name: 'Chitato Sapi Panggang 68g', description: 'Keripik kentang renyah rasa sapi panggang.', price: 11000, stock: 90, category: 'Makanan', status: 'available' },
      // Store 3 - Mini Market Sejahtera
      { storeId: createdStores[2]._id, name: 'Susu Ultra Milk 1L', description: 'Susu UHT full cream untuk keluarga sehat.', price: 19000, stock: 70, category: 'Minuman', status: 'available' },
      { storeId: createdStores[2]._id, name: 'Tepung Terigu 1kg', description: 'Tepung terigu serbaguna untuk aneka masakan dan kue.', price: 13000, stock: 55, category: 'Sembako', status: 'available' },
      { storeId: createdStores[2]._id, name: 'Sambal ABC 335ml', description: 'Sambal asli dengan cita rasa pedas yang menggugah selera.', price: 15000, stock: 65, category: 'Makanan', status: 'available' },
      { storeId: createdStores[2]._id, name: 'Tissue Paseo 250s', description: 'Tisu wajah lembut dan tebal isi 250 lembar.', price: 18000, stock: 80, category: 'Kebutuhan Rumah', status: 'available' },
      { storeId: createdStores[2]._id, name: 'Aqua 600ml (6 pcs)', description: 'Air mineral kemasan 600ml isi 6 botol, segar dan murni.', price: 12000, stock: 120, category: 'Minuman', status: 'available' },
    ];
    const createdProducts = await Product.insertMany(productsData);

    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully!',
      stats: {
        users: createdUsers.length,
        companies: createdCompanies.length,
        leads: createdLeads.length,
        activities: activitiesData.length,
        kanbanTasks: kanbanTasks.length,
        stores: createdStores.length,
        products: createdProducts.length
      }
    });

  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
