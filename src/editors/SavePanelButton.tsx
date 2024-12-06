import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

interface SavePanelState extends SceneObjectState {
  onClick: () => void;
}

function SavePanelRenderer({ model }: SceneComponentProps<SavePanelButton>) {
  const { onClick } = model.useState();
  return (
    <div>
      <Button variant="primary" onClick={onClick}>
        Save Panel
      </Button>
    </div>
  );
}
export class SavePanelButton extends SceneObjectBase<SavePanelState> {
  static Component = SavePanelRenderer;
}
