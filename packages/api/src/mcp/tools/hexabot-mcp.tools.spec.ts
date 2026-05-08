/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  HEXABOT_MCP_TOOL_PROVIDERS,
  HexabotCatalogMcpTools,
  HexabotCmsMcpTools,
  HexabotCredentialMcpTools,
  HexabotMcpServerTools,
  HexabotMemoryDefinitionMcpTools,
  HexabotWorkflowMcpHelper,
  HexabotWorkflowMcpTools,
  HexabotWorkflowRunMcpTools,
  HexabotWorkflowVersionMcpTools,
} from './hexabot-mcp.tools';

describe('HEXABOT_MCP_TOOL_PROVIDERS', () => {
  it('registers every focused MCP tool provider', () => {
    expect(HEXABOT_MCP_TOOL_PROVIDERS).toEqual([
      HexabotWorkflowMcpHelper,
      HexabotWorkflowMcpTools,
      HexabotWorkflowVersionMcpTools,
      HexabotWorkflowRunMcpTools,
      HexabotMemoryDefinitionMcpTools,
      HexabotCatalogMcpTools,
      HexabotCredentialMcpTools,
      HexabotMcpServerTools,
      HexabotCmsMcpTools,
    ]);
  });
});
