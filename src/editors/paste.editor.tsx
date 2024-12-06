import { PanelModel } from '@grafana/data';
import React from 'react';
import { WizardScene } from './WizardScene';

export const PasteEditor = (uid: string) => {
  return ({ addPanel, input }: { addPanel: (p: PanelModel) => void; input: string }) => {
    const scene = new WizardScene({ datasourceUid: uid, url: input, addPanel: addPanel });

    return (
      <>
        <scene.Component model={scene} />
      </>
    );
  };
};
