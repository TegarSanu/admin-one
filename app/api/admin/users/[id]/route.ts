import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { Activity } from "@/models/Activity";
import { Role } from "@/models/Role";
import bcrypt from "bcryptjs";

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Retrieve detailed information for a single user by ID, including recent activity logs.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details and activities retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch user details
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const userDoc = await User.findById(id).populate('role');
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch recent activity logs for this user
    const activities = await Activity.find({ user: userDoc._id })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      user: {
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role?.name || 'Unknown',
        roleId: userDoc.role?._id.toString() || '',
        status: userDoc.status,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt,
      },
      activities: activities.map((act: any) => ({
        id: act._id.toString(),
        type: act.type,
        module: act.module,
        description: act.description,
        createdAt: act.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Updates an existing user's fields by ID.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 description: Role ID reference
 *               status:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: Optional new password to hash and update
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request (e.g. email already exists)
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update user
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const body = await request.json();

    const updateFields: any = {
      name: body.name,
      email: body.email,
      role: body.role,
      status: body.status,
    };

    if (body.password) {
      updateFields.password = await bcrypt.hash(body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }, // Return the updated document
    ).populate('role');

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log Activity
    try {
      const adminRole = await Role.findOne({ name: "Admin" }) || await Role.findOne({ name: "Super Admin" });
      const systemUser = adminRole ? await User.findOne({ role: adminRole._id }) : null;
      if (systemUser) {
        await Activity.create({
          user: systemUser._id,
          type: "Update",
          module: "Users",
          description: `Updated user profile: ${updatedUser.name}`,
          metadata: { userId: updatedUser._id },
        });
      }
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role?.name || 'Unknown',
        status: updatedUser.status,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Failed to update user:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes an existing user by ID.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete user
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log Activity
    try {
      const adminRole = await Role.findOne({ name: "Admin" }) || await Role.findOne({ name: "Super Admin" });
      const systemUser = adminRole ? await User.findOne({ role: adminRole._id }) : null;
      if (systemUser) {
        await Activity.create({
          user: systemUser._id,
          type: "Delete",
          module: "Users",
          description: `Purged user from system: ${deletedUser.name}`,
          metadata: { userId: deletedUser._id, userEmail: deletedUser.email },
        });
      }
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
