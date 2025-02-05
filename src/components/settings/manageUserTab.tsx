import React from "react";
import Card from "../Card";
import Icon from "../icon";
import Link from "next/link";

const ManageUserTab = () => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-5 p-4">
      <Link href="/settings/manage-roles">
        <Card className="cursor-pointer w-full md:w-auto">
          <div className="flex items-center gap-5">
            <Icon name="person" size="32" />
            <div>
              <p className="text-primary !font-bold">Manage Roles</p>
              <p className="w-48 text-[#8C8C8C] pt-2 text-sm">
                Manage user roles within your company
              </p>
            </div>
          </div>
        </Card>
      </Link>

      <Link href="/settings/manage-users">
        <Card className="cursor-pointer w-full md:w-auto">
          <div className="flex items-center gap-5">
            <Icon name="user" size="32" />
            <div>
              <p className="text-primary font-semibold">Manage Users</p>
              <p className="w-48 text-[#8C8C8C] pt-2 text-sm">
                Manage users within your company
              </p>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
};

export default ManageUserTab;
