<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller as BaseController;

class UserController extends BaseController
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Get current authenticated user
     * GET /api/users/me
     */
    public function me(): JsonResponse
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Eager load role with permissions
        $user->load('role.permissions');

        return response()->json($user);
    }

    /**
     * Get all users (only managers)
     * GET /api/users
     */
    public function index(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user->hasPermission('users', 'view_all')) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to view users.'
            ], 403);
        }

        $users = User::with(['role.permissions', 'creator:id,name,email'])
            ->select('id', 'name', 'email', 'role_id', 'created_by_id', 'created_at', 'updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Get a specific user (only managers)
     * GET /api/users/{id}
     */
    public function show($id): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user->hasPermission('users', 'view_all')) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to view users.'
            ], 403);
        }

        $targetUser = User::with(['role.permissions', 'creator:id,name,email'])->find($id);

        if (!$targetUser) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $targetUser
        ]);
    }

    /**
     * Create a new user (only managers)
     * POST /api/users
     */
    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user->hasPermission('users', 'create')) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to create users.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $newUser = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
            'created_by_id' => $user->id,
        ]);

        $newUser->load('role.permissions');

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $newUser
        ], 201);
    }

    /**
     * Update a user (only managers)
     * PUT /api/users/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user->hasPermission('users', 'update')) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to update users.'
            ], 403);
        }

        $targetUser = User::find($id);

        if (!$targetUser) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($id)],
            'password' => 'sometimes|string|min:8',
            'role_id' => 'sometimes|required|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only(['name', 'email', 'role_id']);

        // Only hash password if it's provided
        if ($request->has('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $targetUser->update($updateData);
        $targetUser->load('role.permissions');

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $targetUser
        ]);
    }

    /**
     * Delete a user (only managers)
     * DELETE /api/users/{id}
     */
    public function destroy($id): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user->hasPermission('users', 'delete')) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete users.'
            ], 403);
        }

        $targetUser = User::find($id);

        if (!$targetUser) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Prevent deleting yourself
        if ($targetUser->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.'
            ], 403);
        }

        $targetUser->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Get all roles (for dropdowns in forms)
     * GET /api/users/roles
     */
    public function roles(): JsonResponse
    {
        $roles = Role::select('id', 'name')->get();

        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }
}
