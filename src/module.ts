import { DataSourcePlugin, PasteHandler } from '@grafana/data';
import { Datasource } from './datasource';
import { InfinityConfigEditor } from './editors/config.editor';
import { QueryEditor } from './editors/query.editor';
import { VariableEditor } from './editors/variable.editor';
import { HelpLinks } from './editors/query.help';
import { PasteEditor } from 'editors/paste.editor';

export const plugin = new DataSourcePlugin(Datasource)
  .addHook<(data: string) => Promise<PasteHandler[] | null>>({
    title: 'Infinity JSON URL',
    targets: ['dashboard/dragndrop'],
    hook: async (data: string) => {
      const suggestions: PasteHandler[] = [
        {
          title: 'Customize infinity before adding panel',
          icon: 'edit',
          component: PasteEditor,
        },
      ];
      if (!data.startsWith('https://')) {
        return null;
      }
      if (data.endsWith('.csv')) {
        suggestions.push({
          title: 'Fetch CSV data using Infinity',
          icon: 'web-section-alt',
          panel: {
            id: 0,
            type: 'table',
            title: `CSV Data fetched from ${data}`,
            options: {},
            fieldConfig: {
              defaults: {},
              overrides: [],
            },
            targets: [
              {
                refId: 'A',
                type: 'csv',
                source: 'url',
                format: 'table',
                url: data,
                url_options: {
                  method: 'GET',
                  data: '',
                },
                parser: 'backend',
                root_selector: '',
                columns: [],
                filters: [],
                global_query_id: '',
              },
            ] as any[],
            datasource: { uid: 'fe5vs0dvgvsw0c', type: 'yesoreyeram-infinity-datasource' },
          },
        });
      } else if (data.startsWith('https://')) {
        suggestions.push({
          title: 'Fetch JSON data using Infinity',
          icon: 'web-section-alt',
          panel: {
            id: 0,
            type: 'table',
            title: `JSON Data fetched from ${data}`,
            options: {},
            fieldConfig: {
              defaults: {},
              overrides: [],
            },
            targets: [
              {
                refId: 'A',
                type: 'json',
                source: 'url',
                format: 'table',
                url: data,
                url_options: {
                  method: 'GET',
                  data: '',
                },
                parser: 'backend',
                root_selector: '',
                columns: [],
                filters: [],
                global_query_id: '',
              },
            ] as any[],
            datasource: { uid: 'fe5vs0dvgvsw0c', type: 'yesoreyeram-infinity-datasource' },
          },
        });
      }
      return suggestions;
    },
  })
  .setConfigEditor(InfinityConfigEditor)
  .setQueryEditor(QueryEditor)
  .setVariableQueryEditor(VariableEditor)
  .setQueryEditorHelp(HelpLinks);
