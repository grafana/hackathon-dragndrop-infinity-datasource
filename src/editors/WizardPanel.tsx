import { css } from '@emotion/css';
import React from 'react';

import { SceneComponentProps, SceneDataState, SceneObjectBase, SceneObjectState, sceneGraph } from '@grafana/scenes';
import { Alert, Button, CollapsableSection, Collapse, Field, FieldSet, FilterPill, InlineField, Input, Select, Stack, useStyles2 } from '@grafana/ui';

import { RootSelector, SelectedFragment } from './RootSelector';
import { WizardScene } from './WizardScene';

interface WizardPanelState extends SceneObjectState {
  debugOpen: boolean;
  columns: FieldType[];
  rootSelector: SelectedFragment[];
  loadingSpinner: boolean;
  authIssues: boolean;
}

interface FieldType {
  type: string;
  name: string;
  selected: boolean;
}

export class WizardPanel extends SceneObjectBase<WizardPanelState> {
  public constructor(state?: Partial<WizardPanelState>) {
    super({
      debugOpen: false,
      columns: [],
      rootSelector: [],
      loadingSpinner: false,
      authIssues: false,
      ...state,
    });
    this.addActivationHandler(() => this.activationHandler());
  }

  private activationHandler = () => {
    const sourceData = sceneGraph.getData(this);
    this._subs.add(sourceData.subscribeToState(this.refreshColumns));
  };

  private refreshColumns = (state: SceneDataState) => {
    const newColumns = (state.data?.series[0].fields ?? []).map((f) => ({
      type: f.values.every((v) => !isNaN(v)) ? 'number' : f.type,
      name: f.name,
      selected: true,
    }));
    if (newColumns.length > this.state.columns.length || !newColumns.some((c) => this.state.columns.map((e) => e.name).includes(c.name))) {
      this.setState({
        columns: newColumns,
      });
    }
  };

  public onMethodChange = (method: string) => {
    sceneGraph.getAncestor(this, WizardScene).setState({
      urlMethod: method,
    });
  };

  public onSelectorChange = (rootSelector: SelectedFragment[]) => {
    const newValue = rootSelector.map((e) => e.value).join('.');
    this.setState({ rootSelector, columns: [] });
    sceneGraph.getAncestor(this, WizardScene).setState({
      rootSelector: newValue,
    });
  };

  public toggleDebugOpen = () => {
    this.setState({ debugOpen: !this.state.debugOpen });
  };

  public addHeader = (value?: { key: string; value: string }) => {
    const sceneRoot = sceneGraph.getAncestor(this, WizardScene);
    sceneRoot.setState({
      headers: [...sceneRoot.state.headers, value ?? { key: '', value: '' }],
    });
  };

  public removeHeader = (index: number) => {
    const sceneRoot = sceneGraph.getAncestor(this, WizardScene);
    const newHeaders = [...sceneRoot.state.headers.slice(0, index), ...sceneRoot.state.headers.slice(index + 1)];
    sceneRoot.setState({
      headers: newHeaders,
    });
  };

  public updateHeader = (index: number, key: string, value: string) => {
    const sceneRoot = sceneGraph.getAncestor(this, WizardScene);
    const newHeaders = [...sceneRoot.state.headers];
    newHeaders[index].key = key;
    newHeaders[index].value = value;
    sceneRoot.setState({
      headers: newHeaders,
    });
  };

  public toggleField = (name: string) => {
    const updateIdx = this.state.columns.findIndex((c) => c.name === name);
    const newColumns = [...this.state.columns];
    newColumns[updateIdx].selected = !newColumns[updateIdx].selected;
    this.setState({ columns: newColumns });
    sceneGraph.getAncestor(this, WizardScene).setState({
      columns: newColumns
        .filter((c) => c.selected)
        .map((c) => ({
          type: c.type,
          selector: c.name,
        })),
    });
  };

  public selectAll = (desired: boolean) => {
    const newColumns = [...this.state.columns].map((c) => ({
      ...c,
      selected: desired,
    }));
    this.setState({ columns: newColumns });
    sceneGraph.getAncestor(this, WizardScene).setState({
      columns: newColumns
        .filter((c) => c.selected)
        .map((c) => ({
          type: c.type,
          selector: c.name,
        })),
    });
  };

  public static Component = ({ model }: SceneComponentProps<WizardPanel>) => {
    const styles = useStyles2(getStyles);
    const sceneRoot = sceneGraph.getAncestor(model, WizardScene);

    const { debugOpen, columns, rootSelector, authIssues } = model.useState();
    const { urlMethod, headers } = sceneRoot.useState();
    const { data } = sceneGraph.getData(model).useState();

    const series = data?.series ?? [];
    const fetchErrors = series.map((s) => s.meta?.custom?.['error']).filter((s) => !!s);
    const currentAuthIssues = fetchErrors.some((err) => typeof err === 'string' && (err.indexOf('401') >= 0 || err.indexOf('403') >= 0));
    if (!authIssues && currentAuthIssues) {
      model.setState({ authIssues: true });
      model.addHeader({ key: 'Authorization', value: 'Bearer' });
    } else if (authIssues && !currentAuthIssues) {
      model.setState({ authIssues: false });
    }

    const rootSelectOptions = series[0]?.fields.map((f) => ({ label: f.name, value: f.name })) ?? [];

    return (
      <div>
        <CollapsableSection label="Endpoint Configuration" isOpen={true}>
          <FieldSet>
            <InlineField label="Method">
              <Select options={['GET', 'POST', 'PUT'].map((v) => ({ label: v, value: v }))} value={urlMethod} onChange={(v) => model.onMethodChange(v.value!!)} />
            </InlineField>
            <div>
              <h4>Headers</h4>
              {authIssues && <Alert title="You seem to be unauthenticated">You can try adding authentication information using the header options below</Alert>}
              {headers.length > 0 && (
                <table>
                  <thead>
                    <th>Key</th>
                    <th>Value</th>
                  </thead>
                  <tbody>
                    {headers.map((h, idx) => (
                      <tr key={`${idx}`}>
                        <td className={styles.tableData}>
                          <Input onChange={(v) => model.updateHeader(idx, v.currentTarget.value, h.value)} value={h.key} />
                        </td>
                        <td className={styles.tableData}>
                          <Input onChange={(v) => model.updateHeader(idx, h.key, v.currentTarget.value)} value={h.value} />
                        </td>
                        <td>
                          <Button icon="trash-alt" variant="destructive" fill="outline" onClick={() => model.removeHeader(idx)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <Button size="sm" variant="secondary" onClick={() => model.addHeader()}>
                Add Header
              </Button>
            </div>
          </FieldSet>

          <Collapse label="Debug query" collapsible isOpen={debugOpen} onToggle={model.toggleDebugOpen}>
            <Field label="Request">
              <pre>{series[0]?.meta?.executedQueryString}</pre>
            </Field>
            <Field label="Response">
              <pre>{JSON.stringify(series[0]?.meta?.custom?.['data'], null, 2)}</pre>
            </Field>
          </Collapse>
        </CollapsableSection>
        <hr />

        <CollapsableSection label="Transform your data" isOpen={true}>
          <Field label="Root selector">
            <RootSelector onChange={model.onSelectorChange} value={rootSelector} options={rootSelectOptions} />
          </Field>
          <Field label="Field selector">
            <div>
              <Stack direction="row">
                <Button
                  variant="secondary"
                  fill="outline"
                  onClick={() => {
                    model.selectAll(true);
                  }}
                >
                  Select All
                </Button>
                <Button
                  variant="secondary"
                  fill="outline"
                  onClick={() => {
                    model.selectAll(false);
                  }}
                >
                  Select None
                </Button>
              </Stack>
              <div className={styles.fieldPill}>
                {columns.map((field) => (
                  <FilterPill
                    key={field.name}
                    label={field.name}
                    selected={field.selected}
                    onClick={() => {
                      model.toggleField(field.name);
                    }}
                  />
                ))}
              </div>
            </div>
          </Field>
        </CollapsableSection>
        <hr />
      </div>
    );
  };
}

const getStyles = () => {
  return {
    tableData: css`
      padding-inline-end: 10px;
    `,
    fieldPill: css`
      margin-top: 1em;
      display: flex;
      flex-wrap: wrap;
      gap: 1em;
    `,
    exampleCta: css`
      display: flex;
      gap: 1em;
    `,
  };
};
