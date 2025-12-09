const { aclKnex } = require("./routes.imports.utils");

const getPermissions = async (user_id) => {
  const response = await aclKnex("public.AclGroup as AG")
    .select(
      "AUA.user_id as EmployeeId",
      "AG.id as AppGroupId",
      "AG.name as AppGroupName",
      "AG.access_menu as AccessMenu",
      "AG.access_component as AccessComponent",
      "AG.shared_application as SharedApplication",
      "AG.app_access_name as AppAccessName"
    )
    .join(`public.AclUserAccess as AUA`, "AUA.group_id", "AG.id")
    .join(`public.SystemParameter as SP`, "SP.id", "AG.shared_application")
    .where("AUA.user_id", user_id)
    .andWhere("AG.row_status", 1);

  let permissions = {};
  let menusProps = [];
  let menus = {};

  for (const {
    EmployeeId,
    AppGroupId,
    AppGroupName,
    AccessMenu,
    AccessComponent,
    SharedApplication,
    AppAccessName,
  } of response) {
    permissions[EmployeeId] = permissions[EmployeeId] || {
      menus: [],
      menusProps: [],
      components: [],
      shared_apps: [],
      app_access_names: [],
      Groups: [],
    };

    permissions[EmployeeId].Groups.push({
      id: AppGroupId,
      name: AppGroupName,
      app_access_names: JSON.parse(AppAccessName),
    });

    for (const accessNames of JSON.parse(AppAccessName)) {
      permissions[EmployeeId].app_access_names.push(accessNames);
    }

    //? get the sector name & label in case it will be needed
    const getSharedAppInfo = await aclKnex("public.SystemParameter")
      .select("*")
      .where({
        id: SharedApplication,
      })
      .first();

    permissions[EmployeeId].shared_apps.push(getSharedAppInfo?.name);

    //? get all menu the user has access to
    //? fetch the name from system parameter and add it to the array
    for (const menu of JSON.parse(AccessMenu)) {
      const getMenuInfo = await aclKnex("public.SystemParameter")
        .select("*")
        .where({
          id: menu,
        })
        .first();

      if (getMenuInfo) {
        const config_value = JSON.parse(getMenuInfo?.config_value);

        if (config_value?.main) {
          const getMainMenu = await aclKnex("public.SystemParameter")
            .select("*")
            .where({
              id: config_value?.main,
            })
            .first();

          if (getMainMenu) {
            menus[getMainMenu?.name] = menus[getMainMenu?.name] || {};
            menus[getMainMenu?.name].subLinks =
              menus[getMainMenu?.name]?.subLinks || [];

            if (
              menus[getMainMenu?.name].subLinks.filter(
                (obj) => obj.name === config_value?.name
              )?.length === 0
            ) {
              menus[getMainMenu?.name].subLinks?.push({
                name: config_value?.name,
                url: getMenuInfo?.name,
                label: getMenuInfo?.label,
                order: config_value?.order,
              });
              menus[getMenuInfo?.main]?.subLinks?.sort((a, b) =>
                a?.order > b?.order ? 1 : -1
              );
            }
            if (
              menusProps?.filter((text) => text === config_value?.name)
                ?.length === 0
            ) {
              menusProps.push(config_value?.name);
            }
          }
        } else {
          menus[getMenuInfo?.name] = menus[getMenuInfo?.name] || {};
          menus[getMenuInfo?.name] = menus[getMenuInfo?.name] || {};
          menus[getMenuInfo?.name].name = config_value?.name;
          menus[getMenuInfo?.name].url = getMenuInfo?.name;
          menus[getMenuInfo?.name].label = getMenuInfo?.label;
          menus[getMenuInfo?.name].order = config_value?.order;
          if (
            menusProps?.filter((text) => text === config_value?.name)
              ?.length === 0
          ) {
            menusProps.push(config_value?.name);
          }
        }
      }
    }

    permissions[EmployeeId].menus = Object.values(menus)?.sort((a, b) =>
      a?.order > b?.order ? 1 : -1
    );
    permissions[EmployeeId].menusProps = menusProps;

    //? get all components the user has access to
    //? fetch the name from system parameter
    for (const { component, rights } of JSON.parse(AccessComponent)) {
      const getComponentInfo = await aclKnex("public.SystemParameter")
        .select("*")
        .where({
          id: component,
        })
        .first();

      if (getComponentInfo) {
        //? get all rights the user has for each components
        //? fetch the name from system parameter
        for (const right of rights) {
          const getRightInfo = await aclKnex("public.SystemParameter")
            .select("*")
            .where({
              id: right,
            })
            .first();

          //? Creates a custom name and save it to array
          //? Example if a user has access to list of employees with edit & view rights: EMPLOYEE_LIST_CAN_VIEW, EMPLOYEE_LIST_CAN_EDIT
          if (
            !permissions[EmployeeId].components.includes(
              getComponentInfo?.name + "_" + getRightInfo?.config_value
            )
          )
            permissions[EmployeeId].components.push(
              getComponentInfo?.name + "_" + getRightInfo?.config_value
            );
        }
      }
    }
  }

  return permissions[user_id];
};

module.exports = getPermissions;
