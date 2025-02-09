import React, { useState, useEffect } from "react";
import Button from "@/components/button";
import FloatingLabelInput from "@/components/floating-input";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  capitalizeFirstLetter,
  notifyError,
  notifySuccess,
} from "@/util/utils";
import Loader from "@/components/loader";
import { updateRole } from "@/services/settings";
import Layout from "@/components/layout";
import Card from "@/components/Card";
import Image from "next/image";
import { useRouter } from "next/router";
import { getPermissions } from "@/services/settings";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import WebPageTitle from "@/components/WebPageTitle";
import useClickEvent from "@/stores/useClickEvent";

interface StateProps {
  isLoading: boolean;
  isInitialLoad: boolean;
  permissions: any[];
}

const UpdateRole = () => {
  const formik = useFormik({
    initialValues: {
      roleName: "",
    },
    validationSchema: Yup.object().shape({
      roleName: Yup.string().required("Role name is required!"),
    }),

    validateOnMount: true,

    onSubmit: async values => {
      const payload = {
        id: selectedItem?.id,
        name: values.roleName,
        permissions: selectedIds,
      };
      try {
        setState({ ...state, isLoading: true });
        await updateRole(payload);
        // @ts-ignore
        notifySuccess("Role updated successfully");
        router.back();
      } catch (error: any) {
        notifyError(error.message);
      } finally {
        setState({ ...state, isLoading: false });
      }
    },
  });

  const router = useRouter();
  const { selectedItem } = useClickEvent();

  const [state, setState] = useState<StateProps>({
    isLoading: true,
    isInitialLoad: true,
    permissions: [],
  });

  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    const existingIds = selectedItem?.permissions;

    const result = existingIds?.map((item: any) => {
      return item.id;
    });

    setSelectedIds(result);
  }, [selectedItem?.permissions]);

  useEffect(() => {
    formik.setFieldValue("roleName", selectedItem?.name);
  }, [selectedItem]);

  const fetchPermissions = async () => {
    try {
      const permissions = await getPermissions();
      setState({
        ...state,
        permissions,
        isLoading: false,
        isInitialLoad: false,
      });
    } catch (error) {}
  };

  const handleCheckboxChange = (id: number) => {
    setSelectedIds((prevSelectedIds: any) => {
      if (prevSelectedIds.includes(id)) {
        return prevSelectedIds.filter((selectedId: any) => selectedId !== id);
      } else {
        return [...prevSelectedIds, id];
      }
    });
  };

  return (
    <Layout pageTitle="Update Role" icon="person">
      <WebPageTitle title="Update Role | Ramp Merchant Portal" />
      <Image
        src="/images/arrow-back.svg"
        className="cursor-pointer"
        width={36}
        height={36}
        onClick={() => router.back()}
        alt="back icon"
      />
      <div className="flex justify-center">
        <Card className="mt-5">
          {state.isLoading && state.isInitialLoad ? (
            <div className="grid md:grid-cols-3 gap-10">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} width={300} className="mt-4" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={formik.handleSubmit}>
              <FloatingLabelInput
                label="Role Name"
                id="roleName"
                type="text"
                htmlFor="roleName"
                formik={formik}
                {...formik.getFieldProps("roleName")}
              />

              <div className="border border-solid border-primary rounded-xl mt-5">
                <h2 className="bg-primary text-white font-semibold p-5 text-center rounded-t-lg">
                  What this role can access
                </h2>

                <div className="p-5">
                  {state.permissions.map((item, index) => {
                    return (
                      <div key={index} className="grid md:grid-cols-3 gap-10">
                        {Object.keys(item).map((key: any, index) => (
                          <div
                            key={key}
                            className="bg-white p-4 border border-solid border-[#dedbdb] rounded-2xl shadow-sm cursor-pointer"
                          >
                            <p className="text-lg font-semibold">
                              {capitalizeFirstLetter(key)}
                            </p>

                            <div>
                              {item[key].map((item2: any) => (
                                <div key={item2.id}>
                                  <label className="flex items-center gap-2 leading-8">
                                    <input
                                      type="checkbox"
                                      name="checkbox"
                                      checked={selectedItem?.permissions?.find(
                                        (item: any) => item.id === item2.id
                                      )}
                                      onChange={() =>
                                        handleCheckboxChange(item2.id)
                                      }
                                    />
                                    {item2.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center mt-7">
                <Button
                  className="!w-2/5"
                  text={state.isLoading ? <Loader /> : "Update Role"}
                  ariaLabel="Update role button"
                  disabled={state.isLoading || !formik.isValid}
                  primary
                />
              </div>
            </form>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default UpdateRole;
