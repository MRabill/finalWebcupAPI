const hasPermissions = require("./hasPermissions");

const accessControl = async (
  expressProps,
  accessGroups,
  requiredPermissions
) => {
  const { req, res, next } = expressProps;

  const userPermissions = await hasPermissions(
    req?.user?.id,
    accessGroups,
    requiredPermissions
  );

  if (userPermissions?.success) {
    req.userDetail = userPermissions.userDetail;
    next(null, req.userDetail);
  } else {
    console.log("You are not authorised to make this api call");
    res.status(401).send({
      success: false,
      message: "You are not authorised to make this api call",
      payload: null,
    });
  }
};

module.exports = accessControl;
