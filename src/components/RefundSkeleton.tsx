import { Fragment } from 'react';
import Card from './Card';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const RefundSkeleton: React.FC<{
  singleRow?: boolean;
}> = ({ singleRow }) => {
  return (
    <Fragment>
      <Card>
        <div className='pt-5'>
          {Array.from({ length: singleRow ? 1 : 10 }).map((_, index) => (
            <Skeleton key={index} className='h-2.5 mb-7' />
          ))}
        </div>
      </Card>
    </Fragment>
  );
};

export default RefundSkeleton;
