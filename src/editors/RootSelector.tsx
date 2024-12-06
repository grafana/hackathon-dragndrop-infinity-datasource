import React from 'react';

import { SelectableValue } from '@grafana/data';
import { Button, Icon, Segment, SegmentSection } from '@grafana/ui';

const AddButton = (
  <span className="gf-form-label query-part">
    <Icon name="plus-circle" />
  </span>
);

export interface SelectedFragment {
  value: string;
  alternatives: SelectableValue[];
}

export const RootSelector = ({ value, options, onChange }: { value: SelectedFragment[]; options: SelectableValue[]; onChange: (value: SelectedFragment[]) => void }) => {
  const changeValue = (item: SelectableValue<string>, index: number) => {
    if (index < 0) {
      onChange([
        ...value,
        {
          value: item.value!!,
          alternatives: options,
        },
      ]);
      return;
    }
    const newItem = {
      value: item.value!!,
      alternatives: value[index].alternatives,
    };
    const newValues = value.slice(0, index);
    newValues.push(newItem);
    onChange(newValues);
  };
  const clearValue = () => {
    onChange([]);
  };
  return (
    <SegmentSection label="Root">
      {value.map((v, i) => (
        <Segment<string>
          onChange={function(item: SelectableValue<string>): void {
            changeValue(item, i);
          }}
          key={v.value}
          value={v.value}
          options={v.alternatives}
        />
      ))}
      {options.length >= 1 && options[0].value !== 'A' && (
        <Segment<string>
          Component={AddButton}
          onChange={function(item: SelectableValue<string>): void {
            changeValue(item, -1);
          }}
          options={options}
        />
      )}
      {value.length > 0 && (
        <Button fill="outline" variant="secondary" onClick={clearValue}>
          Clear
        </Button>
      )}
    </SegmentSection>
  );
};
