import { Fragment, useEffect, useState } from "react";
import { getPermissionsByRoleId } from "@/services/settings";
import useClickEvent from "@/stores/useClickEvent";
import Layout from "@/components/layout";
import Card from "@/components/Card";
import Image from "next/image";
import { useRouter } from "next/router";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import Button from "@/components/button";
import WebPageTitle from "@/components/WebPageTitle";

interface StateProps {
  isLoading: boolean;
  data: any[];
  permissions: any[];
}

const Permissions = () => {
  const { selectedItem, rehydrated } = useClickEvent();
  const router = useRouter();

  useEffect(() => {
    fetchPermissions();
  }, [rehydrated, selectedItem]);

  const [state, setState] = useState<StateProps>({
    isLoading: true,
    data: [],
    permissions: [],
  });

  const fetchPermissions = async () => {
    if (rehydrated) {
      const data = await getPermissionsByRoleId(selectedItem?.id);
      const result = data[0].permissions;
      setState({ ...state, data, permissions: result, isLoading: false });
    }
  };
  return (
    <Layout pageTitle="Role Permissions" icon="person">
      <WebPageTitle title="Role Permissions | Cray Merchant Portal" />
      <Image
        src="/images/arrow-back.svg"
        className="cursor-pointer"
        width={36}
        height={36}
        onClick={() => router.back()}
        alt="back icon"
      />
      <div className="mt-10">
        {state.isLoading ? (
          <Fragment>
            <Skeleton width={250} height={25} />
            <div className="flex flex-wrap gap-5 pt-7">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton
                  key={index}
                  width={200}
                  height={40}
                  className="!rounded-[40px]"
                />
              ))}
            </div>
          </Fragment>
        ) : state.permissions?.length !== 0 ? (
          state.data.map(item => {
            return (
              <Card key={item.id}>
                <h1 className="text-xl font-semibold">
                  Permissions for {item.name}
                </h1>

                <div className="flex flex-wrap gap-5 pt-5">
                  {item.permissions.map((item2: any) => (
                    <div
                      key={item2.id}
                      className="rounded-[40px] bg-primary text-sm text-white py-2 px-5"
                    >
                      {item2.name}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })
        ) : (
          <EmptyState
            title="No Permissions Added"
            subTitle="We couldn't find any permissions added to this role"
            iconName="person"
          >
            <Link href="/settings/add-role">
              <Button
                ariaLabel="Create Role"
                text="Create New Role"
                primary
                medium
              />
            </Link>
          </EmptyState>
        )}
      </div>
    </Layout>
  );
};

export default Permissions;
