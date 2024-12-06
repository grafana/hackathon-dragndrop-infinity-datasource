import { css } from '@emotion/css';
import React from 'react';

import { PanelData, VisualizationSuggestion, VisualizationSuggestionScore, VisualizationSuggestionsBuilder } from '@grafana/data';
import { getPluginImportUtils } from '@grafana/runtime';
import { SceneComponentProps, SceneDataState, SceneObjectBase, SceneObjectState, sceneGraph } from '@grafana/scenes';

import { VisualizationSuggestionCard, VizTypeChangeDetails } from './VisualizationSuggestionCard';
import { VizSuggestionSelectedEvent, WizardScene } from './WizardScene';
import { CollapsableSection } from '@grafana/ui';

interface SuggestionPanelState extends SceneObjectState {
  suggestions: VisualizationSuggestion[];
}

export class SuggestionPanel extends SceneObjectBase<SuggestionPanelState> {
  public constructor() {
    super({ suggestions: [] });
    this.addActivationHandler(() => this.activationHandler());
  }
  private activationHandler() {
    const sourceData = sceneGraph.getData(this);
    this._subs.add(sourceData.subscribeToState(this.refreshSuggestions));
    this.refreshSuggestions(sourceData.state);
  }
  private refreshSuggestions = async (state: SceneDataState) => {
    const suggestions = await this.getSuggestions(state.data);
    this.setState({
      suggestions,
    });
  };
  public updatePanel = (vs: VizTypeChangeDetails) => {
    sceneGraph.getAncestor(this, WizardScene).publishEvent(new VizSuggestionSelectedEvent(vs));
  };
  public getSuggestions = async (data?: PanelData): Promise<Array<VisualizationSuggestion<any, any>>> => {
    const checkPlugins = ['timeseries', 'barchart', 'gauge', 'stat', 'piechart', 'bargauge', 'table', 'state-timeline', 'status-history', 'logs', 'candlestick'];
    const importer = getPluginImportUtils();

    const builder = new VisualizationSuggestionsBuilder(data);

    for (const pluginId of checkPlugins) {
      const plugin = await importer.importPanelPlugin(pluginId);
      const supplier = plugin.getSuggestionsSupplier();

      if (supplier) {
        supplier.getSuggestionsForData(builder);
      }
    }

    const list = builder.getList();
    return list.sort((a, b) => {
      if (builder.dataSummary.preferredVisualisationType) {
        if (a.pluginId === builder.dataSummary.preferredVisualisationType) {
          return -1;
        }
        if (b.pluginId === builder.dataSummary.preferredVisualisationType) {
          return 1;
        }
      }
      return (b.score ?? VisualizationSuggestionScore.OK) - (a.score ?? VisualizationSuggestionScore.OK);
    });
  };

  public static Component = ({ model }: SceneComponentProps<SuggestionPanel>) => {
    const { suggestions } = model.useState();
    const data = sceneGraph.getData(model).useState();
    return (
      <CollapsableSection label="Suggestions" isOpen={true}>
        <div
          className={css`
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            row-gap: 20px;
          `}
        >
          {suggestions.map((suggestion, index) => (
            <VisualizationSuggestionCard key={index} data={data.data!} suggestion={suggestion} onChange={(v) => model.updatePanel(v)} width={200} />
          ))}
        </div>
      </CollapsableSection>
    );
  };
}
