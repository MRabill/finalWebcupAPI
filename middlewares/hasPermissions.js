const {
  knexDb,
  ACL_DB,
  EMP_TB,
  EMP_DB,
  EMP_TB_ID_FIELD,
  EMP_TB_EMAIL_FIELD,
  knex,
  aclKnex,
} = require("../utils/routes.imports.utils");

const hasPermissions = async (user_id, accessGroup, requiredPermissions) => {
  const userDetail = {};

  // Check if the current request user is an admin
  // Admins have access to all routes and all permissions
  if (
    global.currentReq &&
    global.currentReq.user &&
    global.currentReq.user.isAdmin === true
  ) {
    return {
      success: true,
      userDetail: {
        userGroup: "ADMIN",
        isAdmin: true,
        isSuperAdmin: global.currentReq.user.isSuperAdmin,
        adminId: global.currentReq.user.adminId,
        // Give admin all permissions
        permission: {
          view: true,
          add: true,
          edit: true,
          delete: true,
          download: true,
          upload: true,
          deactivate: true,
          change_status: true,
          // Custom admin permissions from DB
          ...(global.currentReq.user.adminPermissions || {}),
        },
      },
    };
  }

  // Special handling for child users with STUDENT role
  if (
    user_id &&
    accessGroup.includes("STUDENT") &&
    requiredPermissions.length === 0
  ) {
    // If the request is from a child user and the route requires STUDENT role
    // First check if this is a child user by looking for the is_child flag in the request
    if (
      global.currentReq &&
      global.currentReq.user &&
      global.currentReq.user.is_child === true
    ) {
      return {
        success: true,
        userDetail: {
          userGroup: "STUDENT",
          isChild: true,
        },
      };
    }
  }

  // Handle normal role-based access check for non-admin users
  if (accessGroup.length > 0) {
    const userGroup = await aclKnex("public.AclUserAccess")
      .select("AclUserAccess.group_id", "AclGroup.name")
      .leftJoin("public.AclGroup", "AclGroup.id", "AclUserAccess.group_id")
      .where("AclUserAccess.user_id", user_id)
      .whereIn("AclGroup.name", accessGroup)
      .first();

    if (!userGroup || userGroup?.length === 0) {
      return {
        success: false,
        userDetail: null,
      };
    }

    userDetail.userGroup = userGroup?.name;
  }

  if (requiredPermissions.length > 0) {
    const userPermissions = await aclKnex("public.AclUserPermission")
      .select(
        "view",
        "add",
        "edit",
        "delete",
        "download",
        "upload",
        "deactivate",
        "change_status"
      )
      .where({ user_id: user_id })
      .where("row_status", 1)
      .first();

    const hasAllPermissions = requiredPermissions.every((permission) => {
      // Convert permission to lower case and check if the user has that permission
      return userPermissions[permission.toLowerCase()] === "1";
    });

    if (!hasAllPermissions) {
      return {
        success: false,
        userDetail: null,
      };
    }

    const booleanPermissions = Object.fromEntries(
      Object.entries(userPermissions).map(([key, value]) => [
        key,
        value === "1",
      ])
    );

    userDetail.permission = booleanPermissions;
  }

  return {
    success: true,
    userDetail,
  };
};

module.exports = hasPermissions;
