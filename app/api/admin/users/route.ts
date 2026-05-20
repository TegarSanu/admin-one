import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { Activity } from "@/models/Activity";
import { Role } from "@/models/Role";
import bcrypt from "bcryptjs";

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of users with optional filtering, search, status, and pagination.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of users to return
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role name (e.g., 'User', 'Editor', 'Super Admin')
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status ('Active' or 'Inactive')
 *     responses:
 *       200:
 *         description: A list of users and total count
 *       500:
 *         description: Failed to fetch users
 */
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 10;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    let filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      const roleDoc = await Role.findOne({ name: role });
      if (roleDoc) {
        filter.role = roleDoc._id;
      }
    }

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    // Fetch users sorted by newest first
    let query = User.find(filter).populate('role').sort({ createdAt: -1 });
    if (limit > 0) {
      query = query.skip(skip).limit(limit);
    }

    const users = await query;
    const total = await User.countDocuments(filter);

    // Transform _id to id for frontend compatibility with our existing types
    const formattedUsers = users.map((user: any) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role?.name || 'Unknown',
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json({ users: formattedUsers, total });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user in the system with default or custom role.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 description: Role ID (ObjectId string)
 *               status:
 *                 type: string
 *                 default: 'Active'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request (e.g., email already exists, missing fields)
 *       500:
 *         description: Failed to create user
 */
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    // Password hashing
    if (!body.password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Resolve default role if none provided
    let finalRole = body.role;
    if (!finalRole) {
      const defaultRole = await Role.findOne({ name: 'User' });
      finalRole = defaultRole?._id;
    }

    // Create new user
    const newUser = await User.create({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: finalRole,
      status: body.status || "Active",
    });

    const populatedUser = await User.findById(newUser._id).populate('role');

    // Log Activity
    try {
      const systemRole = await Role.findOne({ name: 'Super Admin' });
      const systemUser = await User.findOne({ role: systemRole?._id });
      if (systemUser) {
        await Activity.create({
          user: systemUser._id,
          type: "Create",
          module: "Users",
          description: `Created new user: ${populatedUser?.name} (${populatedUser?.role?.name})`,
          metadata: { userId: populatedUser?._id },
        });
      }
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: populatedUser?._id.toString(),
          name: populatedUser?.name,
          email: populatedUser?.email,
          role: populatedUser?.role?.name || 'Unknown',
          status: populatedUser?.status,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Failed to create user:", error);
    // Basic error handling for duplicate email
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
