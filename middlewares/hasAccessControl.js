const hasPermissions = require("./hasPermissions");

const hasAccessControl = async (
  req,
  requiredPermissions = [],
  requiredSharedApps = []
) => {
  const userPermissions = await hasPermissions(
    req?.user?.id,
    requiredPermissions,
    requiredSharedApps
  );

  if (userPermissions) {
    return true;
  } else {
    return false;
  }
};

module.exports = hasAccessControl;
