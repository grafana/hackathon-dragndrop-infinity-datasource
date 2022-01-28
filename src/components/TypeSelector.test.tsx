import React from 'react';
import { render } from '@testing-library/react';
import { TypeSelector } from './TypeSelector';
import { InfinityQuery } from '../types';

describe('app/components/TypeSelector', () => {
  it('should render without error', () => {
    const query = {} as InfinityQuery;
    const onChange = jest.fn();
    const onRunQuery = jest.fn();
    const result = render(<TypeSelector query={query} onChange={onChange} onRunQuery={onRunQuery} mode="standard" />);
    expect(result.container.firstChild).not.toBeNull();
  });
});
