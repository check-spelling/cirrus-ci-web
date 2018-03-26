import React from 'react';
import CirrusCircularProgress from "./CirrusCircularProgress";

const LoadingComponent = ({isLoading, error}) => {
  if (isLoading) {
    return <CirrusCircularProgress/>;
  }
  else if (error) {
    // todo: make it prettier
    return <div>Sorry, there was a problem loading the page.</div>;
  }
  else {
    return null;
  }
};

export default LoadingComponent;
