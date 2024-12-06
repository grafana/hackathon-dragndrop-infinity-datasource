import { PanelModel } from '@grafana/data';
import React from 'react';
import { WizardScene } from './WizardScene';

export const PasteEditor = ({ addPanel, input }: { addPanel: (p: PanelModel) => void; input: string }) => {
  const scene = new WizardScene({ datasourceUid: 'fe5vs0dvgvsw0c', url: input, addPanel: addPanel });

  return (
    <>
      <scene.Component model={scene} />
    </>
  );
};
