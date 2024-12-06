import { css } from '@emotion/css';
import React from 'react';

import { BusEventWithPayload, GrafanaTheme2, PanelModel } from '@grafana/data';
import { SceneQueryRunner, PanelBuilders, SceneCSSGridLayout, SceneCSSGridItem, SceneObjectBase, SceneObjectState, SceneComponentProps, VizPanel, SceneObjectRef, sceneGraph } from '@grafana/scenes';
import { useStyles2 } from '@grafana/ui';

import { SuggestionPanel } from './SuggestionPanel';
import { VizTypeChangeDetails } from './VisualizationSuggestionCard';
import { WizardPanel } from './WizardPanel';

interface HeaderEntry {
  key: string;
  value: string;
}

interface WizardSceneState extends SceneObjectState {
  body: SceneCSSGridLayout;
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
  previewContainer: SceneObjectRef<SceneCSSGridItem>;
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
      new SceneCSSGridItem({
        gridColumn: '2',
        gridRow: '1',
        body: PanelBuilders.table().setTitle('Response Data').build(),
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
      body: new SceneCSSGridLayout({
        templateColumns: `repeat(2, minmax(400px, 1fr))`,
        templateRows: `repeat(2,minmax(400px,min-content))`,
        rowGap: 2,
        columnGap: 2,
        children: [
          new SceneCSSGridItem({
            gridColumn: '1',
            gridRow: '1/3',
            body: new WizardPanel({ addPanel: state.addPanel }),
          }),
          previewContainer.resolve(),
          new SceneCSSGridItem({
            gridColumn: '2',
            gridRow: '2',
            body: new SuggestionPanel(),
          }),
        ],
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

  public createDashboard = () => {
    const queries = this.getQueries();
    return {
      meta: {
        isNew: true,
      },
      dashboard: {
        annotations: {
          list: [
            {
              builtIn: 1,
              datasource: {
                type: 'grafana',
                uid: '-- Grafana --',
              },
              enable: true,
              hide: true,
              iconColor: 'rgba(0, 211, 255, 1)',
              name: 'Annotations & Alerts',
              type: 'dashboard',
            },
          ],
        },
        editable: true,
        fiscalYearStartMonth: 0,
        graphTooltip: 0,
        links: [],
        panels: [
          {
            datasource: {
              type: 'yesoreyeram-infinity-datasource',
              uid: this.state.datasourceUid,
            },
            fieldConfig: this.state.appliedSuggestion?.fieldConfig,
            options: this.state.appliedSuggestion?.options,
            type: this.state.appliedSuggestion?.pluginId ?? 'table',
            targets: queries,
            gridPos: {
              x: 0,
              y: 0,
              w: 12,
              h: 8,
            },
          },
        ],
        schemaVersion: 39,
        tags: [],
        templating: {
          list: [],
        },
        time: {
          from: 'now-1h',
          to: 'now',
        },
        timepicker: {},
        timezone: 'browser',
        title: 'New dashboard',
        version: 0,
        weekStart: '',
      },
    };
  };

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
