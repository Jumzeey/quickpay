import React, { Fragment } from "react";
import Image from "next/image";

const ComingSoon = () => {
  return (
    <Fragment>
      <div className="flex justify-center mt-20">
        <Image
          src="/images/coming-soon.svg"
          alt="Coming Soon"
          width={500}
          height={500}
          priority
        />
      </div>
      <div className="text-center">
        <h1 className="font-semibold text-3xl">Coming Soon!</h1>
        <p className="mt-5">
        This feature is coming soon to Sarepay! Stay tuned and watch out for an email when we launch it!
        </p>
      </div>
    </Fragment>
  );
};

export default ComingSoon;
