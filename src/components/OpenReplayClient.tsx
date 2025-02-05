import React from 'react';
import useOpenReplay from '../hooks/useOpenReplay';

const OpenReplayClient: React.FC = () => {
  useOpenReplay();
  return null;
};

export default OpenReplayClient;
