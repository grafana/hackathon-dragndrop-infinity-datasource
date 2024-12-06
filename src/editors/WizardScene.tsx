import { css } from '@emotion/css';
import React from 'react';

import { BusEventWithPayload, GrafanaTheme2, PanelModel } from '@grafana/data';
import {
  SceneQueryRunner,
  SplitLayout,
  PanelBuilders,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneObjectState,
  SceneComponentProps,
  VizPanel,
  SceneObjectRef,
  sceneGraph,
} from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';

import { SuggestionPanel } from './SuggestionPanel';
import { VizTypeChangeDetails } from './VisualizationSuggestionCard';
import { WizardPanel } from './WizardPanel';
import { SavePanelButton } from './SavePanelButton';

interface HeaderEntry {
  key: string;
  value: string;
}

interface WizardSceneState extends SceneObjectState {
  body: SplitLayout;
  columns: Array<{
    selector: string;
    text?: string;
    type: string;
  }>;
  url: string;
  rootSelector: string;
  urlMethod: string;
  headers: HeaderEntry[];
  datasourceUid?: string;
  previewContainer: SceneObjectRef<SceneFlexItem>;
  appliedSuggestion?: VizTypeChangeDetails;
  addPanel: (model: PanelModel) => void;
}

export class VizSuggestionSelectedEvent extends BusEventWithPayload<VizTypeChangeDetails> {
  public static type = 'visualization-suggestion-selected-event';
}

export class WizardScene extends SceneObjectBase<WizardSceneState> {
  constructor(state: Partial<WizardSceneState>) {
    const queryRunner = new SceneQueryRunner({
      datasource: {
        type: 'yesoreyeram-infinity-datasource',
        uid: state.datasourceUid,
      },
      queries: [
        {
          refId: 'A',
          type: 'json',
          source: 'url',
          format: 'table',
          url: state.url,
          url_options: {
            method: 'GET',
            data: '',
          },
          parser: 'backend',
          root_selector: state.rootSelector,
          columns: [],
          filters: [],
          global_query_id: '',
        },
      ],
    });

    const previewContainer = new SceneObjectRef(
      new SceneFlexItem({
        body: PanelBuilders.table().setTitle('Response Data').build(),
        height: '400px',
      })
    );

    super({
      $data: queryRunner,
      columns: [],
      headers: [],
      rootSelector: '',
      url: '',
      urlMethod: 'GET',
      previewContainer,
      addPanel: () => { },
      body: new SplitLayout({
        direction: 'row',
        primary: previewContainer.resolve(),
        secondary: new SceneFlexLayout({
          direction: 'column',
          children: [
            new SceneFlexItem({
              body: new WizardPanel({}),
            }),
            new SceneFlexItem({
              body: new SuggestionPanel(),
            }),
            new SceneFlexItem({
              body: new SavePanelButton({
                onClick: () => {
                  const queries = this.getQueries();
                  const panel = this.state.previewContainer.resolve().state.body as VizPanel;
                  this.state.addPanel({
                    title: 'JSON Data',
                    id: 0,
                    type: panel.state.pluginId,
                    options: panel.state.options,
                    fieldConfig: panel.state.fieldConfig,
                    targets: queries,
                  });
                },
              }),
            }),
          ],
        }),
      }),
      ...state,
    });

    this.subscribeToState(({ columns, url, rootSelector, urlMethod, headers }) => {
      queryRunner.setState({
        ...queryRunner.state,
        queries: queryRunner.state.queries.map((q) => ({
          ...q,
          columns: columns,
          url: url,
          root_selector: rootSelector,
          url_options: {
            method: urlMethod,
            data: '',
            headers: headers,
          },
        })),
      });
      queryRunner.runQueries();
    });
    this.subscribeToEvent(VizSuggestionSelectedEvent, (event) => {
      const newPanel = new VizPanel({
        pluginId: event.payload.pluginId,
        fieldConfig: event.payload.fieldConfig,
        options: event.payload.options,
        title: 'Response Data',
      });
      this.state.previewContainer.resolve().setState({ body: newPanel });
      this.setState({ appliedSuggestion: event.payload });
    });
  }

  public getQueries = () => {
    const dataState = sceneGraph.getData(this).state;
    return dataState.data?.request?.targets ?? [];
  };

  public static Component = ({ model }: SceneComponentProps<WizardScene>) => {
    const { body } = model.useState();
    const styles = useStyles2(getStyles);

    return (
      <div className={styles.container}>
        <div className={styles.body}>
          <body.Component model={body} />
        </div>
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      flexGrow: 1,
      display: 'flex',
      gap: theme.spacing(2),
      minHeight: '100%',
      flexDirection: 'column',
    }),
    body: css({
      flexGrow: 1,
      display: 'flex',
      gap: theme.spacing(1),
    }),
  };
};
