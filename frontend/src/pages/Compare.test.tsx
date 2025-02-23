/*
 * Copyright 2022 The Kubeflow Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { CommonTestWrapper } from 'src/TestWrapper';
import { Apis } from 'src/lib/Apis';
import { PageProps } from './Page';
import { QUERY_PARAMS } from 'src/components/Router';
import { ApiRunDetail } from 'src/apis/run';
import Compare, { CompareProps } from './Compare';
import * as features from 'src/features';
import { testBestPractices } from 'src/TestUtils';
import TestUtils from 'src/TestUtils';

testBestPractices();
describe('Switch between v1 and v2 Run Comparison pages', () => {
  const MOCK_RUN_1_ID = 'mock-run-1-id';
  const MOCK_RUN_2_ID = 'mock-run-2-id';
  const MOCK_RUN_3_ID = 'mock-run-3-id';
  const updateBannerSpy = jest.fn();

  function generateProps(): CompareProps {
    const pageProps: PageProps = {
      history: {} as any,
      location: {
        search: `?${QUERY_PARAMS.runlist}=${MOCK_RUN_1_ID},${MOCK_RUN_2_ID},${MOCK_RUN_3_ID}`,
      } as any,
      match: {} as any,
      toolbarProps: { actions: {}, breadcrumbs: [], pageTitle: '' },
      updateBanner: updateBannerSpy,
      updateDialog: () => null,
      updateSnackbar: () => null,
      updateToolbar: () => null,
    };
    return Object.assign(pageProps, {
      collapseSections: {},
      fullscreenViewerConfig: null,
      metricsCompareProps: { rows: [], xLabels: [], yLabels: [] },
      paramsCompareProps: { rows: [], xLabels: [], yLabels: [] },
      runs: [],
      selectedIds: [],
      viewersMap: new Map(),
      workflowObjects: [],
    });
  }

  let runs: ApiRunDetail[] = [];

  function newMockRun(id?: string, v2?: boolean): ApiRunDetail {
    return {
      pipeline_runtime: {
        workflow_manifest: '{}',
      },
      run: {
        id: id || 'test-run-id',
        name: 'test run ' + id,
        pipeline_spec: v2 ? { pipeline_manifest: '' } : { workflow_manifest: '' },
      },
    };
  }

  it('getRun is called with query param IDs', async () => {
    const getRunSpy = jest.spyOn(Apis.runServiceApi, 'getRun');
    runs = [
      newMockRun(MOCK_RUN_1_ID, true),
      newMockRun(MOCK_RUN_2_ID, true),
      newMockRun(MOCK_RUN_3_ID, true),
    ];
    getRunSpy.mockImplementation((id: string) => runs.find(r => r.run!.id === id));

    // v2 feature is turn on.
    jest.spyOn(features, 'isFeatureEnabled').mockImplementation(featureKey => {
      if (featureKey === features.FeatureKey.V2_ALPHA) {
        return true;
      }
      return false;
    });

    render(
      <CommonTestWrapper>
        <Compare {...generateProps()} />
      </CommonTestWrapper>,
    );

    expect(getRunSpy).toHaveBeenCalledWith(MOCK_RUN_1_ID);
    expect(getRunSpy).toHaveBeenCalledWith(MOCK_RUN_2_ID);
    expect(getRunSpy).toHaveBeenCalledWith(MOCK_RUN_3_ID);
  });

  it('Show v1 page if all runs are v1 and the v2 feature flag is enabled', async () => {
    const getRunSpy = jest.spyOn(Apis.runServiceApi, 'getRun');
    runs = [
      newMockRun(MOCK_RUN_1_ID, false),
      newMockRun(MOCK_RUN_2_ID, false),
      newMockRun(MOCK_RUN_3_ID, false),
    ];
    getRunSpy.mockImplementation((id: string) => runs.find(r => r.run!.id === id));

    // v2 feature is turn on.
    jest.spyOn(features, 'isFeatureEnabled').mockImplementation(featureKey => {
      if (featureKey === features.FeatureKey.V2_ALPHA) {
        return true;
      }
      return false;
    });

    render(
      <CommonTestWrapper>
        <Compare {...generateProps()} />
      </CommonTestWrapper>,
    );

    await waitFor(() => screen.getByText('Run overview'));
  });

  it('Show v1 page if some runs are v1 and the v2 feature flag is enabled', async () => {
    const getRunSpy = jest.spyOn(Apis.runServiceApi, 'getRun');
    runs = [
      newMockRun(MOCK_RUN_1_ID, false),
      newMockRun(MOCK_RUN_2_ID, true),
      newMockRun(MOCK_RUN_3_ID, true),
    ];
    getRunSpy.mockImplementation((id: string) => runs.find(r => r.run!.id === id));

    // v2 feature is turn on.
    jest.spyOn(features, 'isFeatureEnabled').mockImplementation(featureKey => {
      if (featureKey === features.FeatureKey.V2_ALPHA) {
        return true;
      }
      return false;
    });

    render(
      <CommonTestWrapper>
        <Compare {...generateProps()} />
      </CommonTestWrapper>,
    );

    await waitFor(() => screen.getByText('Run overview'));
  });

  it('Show v2 page if all runs are v2 and the v2 feature flag is enabled', async () => {
    const getRunSpy = jest.spyOn(Apis.runServiceApi, 'getRun');
    runs = [
      newMockRun(MOCK_RUN_1_ID, true),
      newMockRun(MOCK_RUN_2_ID, true),
      newMockRun(MOCK_RUN_3_ID, true),
    ];
    getRunSpy.mockImplementation((id: string) => runs.find(r => r.run!.id === id));

    // v2 feature is turn on.
    jest.spyOn(features, 'isFeatureEnabled').mockImplementation(featureKey => {
      if (featureKey === features.FeatureKey.V2_ALPHA) {
        return true;
      }
      return false;
    });

    render(
      <CommonTestWrapper>
        <Compare {...generateProps()} />
      </CommonTestWrapper>,
    );

    await waitFor(() => screen.getByText('This is the V2 Run Comparison page.'));
  });

  it('Show v1 page if some runs are v1 and the v2 feature flag is disabled', async () => {
    const getRunSpy = jest.spyOn(Apis.runServiceApi, 'getRun');
    runs = [
      newMockRun(MOCK_RUN_1_ID, false),
      newMockRun(MOCK_RUN_2_ID, true),
      newMockRun(MOCK_RUN_3_ID, true),
    ];
    getRunSpy.mockImplementation((id: string) => runs.find(r => r.run!.id === id));

    // v2 feature is turn off.
    jest.spyOn(features, 'isFeatureEnabled').mockImplementation(_ => {
      return false;
    });

    render(
      <CommonTestWrapper>
        <Compare {...generateProps()} />
      </CommonTestWrapper>,
    );

    await waitFor(() => screen.getByText('Run overview'));
  });

  it('Show v1 page if all runs are v2 and the v2 feature flag is disabled', async () => {
    const getRunSpy = jest.spyOn(Apis.runServiceApi, 'getRun');
    runs = [
      newMockRun(MOCK_RUN_1_ID, true),
      newMockRun(MOCK_RUN_2_ID, true),
      newMockRun(MOCK_RUN_3_ID, true),
    ];
    getRunSpy.mockImplementation((id: string) => runs.find(r => r.run!.id === id));

    // v2 feature is turn off.
    jest.spyOn(features, 'isFeatureEnabled').mockImplementation(_ => {
      return false;
    });

    render(
      <CommonTestWrapper>
        <Compare {...generateProps()} />
      </CommonTestWrapper>,
    );

    await waitFor(() => screen.getByText('Run overview'));
  });

  it('Show page error on page when getRun request fails', async () => {
    const getRunSpy = jest.spyOn(Apis.runServiceApi, 'getRun');
    runs = [
      newMockRun(MOCK_RUN_1_ID, true),
      newMockRun(MOCK_RUN_2_ID, true),
      newMockRun(MOCK_RUN_3_ID, true),
    ];
    getRunSpy.mockImplementation(_ => {
      throw {
        text: () => Promise.resolve('test error'),
      };
    });

    // v2 feature is turn on.
    jest.spyOn(features, 'isFeatureEnabled').mockImplementation(featureKey => {
      if (featureKey === features.FeatureKey.V2_ALPHA) {
        return true;
      }
      return false;
    });

    render(
      <CommonTestWrapper>
        <Compare {...generateProps()} />
      </CommonTestWrapper>,
    );

    await TestUtils.flushPromises();

    expect(updateBannerSpy).toHaveBeenLastCalledWith({
      additionalInfo: 'test error',
      message: 'Error: failed loading 3 runs. Click Details for more information.',
      mode: 'error',
    });
  });
});
