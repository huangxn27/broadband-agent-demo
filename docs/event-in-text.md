insightAgent场景的text流式数据中，包含的一些事件类型：

<!--event:plan-->
{"goal": "找出 CEI 分数较低的 PON 口，并分析原因", "total_phases": 4, "phases": [{"phase_id": 1, "name": "L1-定位低分 PON 口", "milestone": "识别 CEI_score 最低的 PON 口列表", "table_level": "day", "description": "使用 OutstandingMin 洞察函数，在 day 表上按 portUuid 维度找出 CEI_score 最低的 PON 口", "focus_dimensions": []}, {"phase_id": 2, "name": "L2-维度扫描", "milestone": "确定哪个维度（ODN/Rate/Service 等）拖低 CEI 分数", "table_level": "day", "description": "聚焦低分 PON 口，比较 8 个维度_score，找出显著偏低的维度", "focus_dimensions": []}, {"phase_id": 3, "name": "L3-根因定位", "milestone": "针对问题维度，分析细化字段定位根因指标", "table_level": "day", "description": "针对 L2 发现的问题维度，分析其 HighCnt/Percent 等细化字段，定位具体根因指标", "focus_dimensions": []}, {"phase_id": 4, "name": "L4-时序验证", "milestone": "在分钟表上验证根因指标的时序分布与相关性", "table_level": "minute", "description": "下钻到 minute 表，分析质差次数与根因指标的时序相关性，验证因果关系", "focus_dimensions": []}]}

<!--event:decompose_result-->
{"phase_id": 1, "total_steps": 1, "steps": [{"step": 1, "insight_types": ["OutstandingMin"], "rationale": "找出 CEI_score 最低的 PON 口列表"}]}

<!--event:phase_start-->
{"phase_id": 1, "name": "L1-定位低分 PON 口", "status": "running"}

<!--event:step_result-->
{"phase_id": 1, "step_id": 1, "insight_type": "OutstandingMin", "significance": 0.7348, "summary": "CEI_score 最小值出现在 port_4（55.49），低于第二名 6.49，z-score=2.20", "found_entities": {"portUuid": ["port_4", "port_5", "port_1", "port_17", "port_15", "port_9", "port_7", "port_19", "port_8", "port_12"]}, "status": "ok"}

<!--event:decompose_result-->
{"phase_id": 2, "total_steps": 2, "steps": [{"step": 1, "insight_types": ["OutstandingMin"], "rationale": "找出 8 个维度中得分最低的维度"}, {"step": 2, "insight_types": ["Attribution"], "rationale": "归因分析，确认哪个维度拖低 CEI 分数"}]}

<!--event:phase_start-->
{"phase_id": 2, "name": "L2-维度扫描", "status": "running"}

<!--event:step_result-->
{"phase_id": 2, "step_id": 2, "insight_type": "Attribution", "significance": 0.2123, "summary": "对 CEI_score 拉低作用最大的分组：port_15, port_9, port_5", "found_entities": {"portUuid": ["port_15", "port_9", "port_5", "port_12", "port_19", "port_8", "port_7", "port_4", "port_1", "port_17"]}, "status": "ok"}

<!--event:reflect-->
{"phase_id": 2, "choice": "A", "reason": "当前发现与原计划一致：Wifi_score 是 6/10 个低分 PON 口的最差维度，L3 将针对 Wifi 维度分析细化字段（如 interference、diagTimeDelay 等）"}


### 实际的sse事件流样式

{
    "event": "text",
    "data": {
      "delta": "<!--",
      "stepId": "insight"
    }
  },
  {
    "event": "text",
    "data": {
      "delta": "event:step_result",
      "stepId": "insight"
    }
  },
  {
    "event": "text",
    "data": {
      "delta": "-->\n",
      "stepId": "insight"
    }
  },
  {
    "event": "text",
    "data": {
      "delta": "{\"phase_id\":",
      "stepId": "insight"
    }
  },
  {
    "event": "text",
    "data": {
      "delta": " 3, \"",
      "stepId": "insight"
    }
  },

## render 出现两个图表部分重合的render事件样例
 {
    "event": "render",
    "data": {
      "renderType": "insight",
      "renderData": {
        "charts": [
          {
            "chartId": "insight_insight_query_433703",
            "title": "CEI_score 归因分析",
            "conclusion": "对 CEI_score 拉低作用最大的分组: port_15, port_9, port_5；显著性 0.21",
            "echartsOption": {
              "chart_type": "attribution",
              "title": {
                "text": "CEI_score 归因分析",
                "left": "center",
                "textStyle": {
                  "fontSize": 13,
                  "color": "#4a4a4a",
                  "fontWeight": 600
                }
              },
              "tooltip": {
                "trigger": "item",
                "confine": true,
                "textStyle": {
                  "fontSize": 11
                }
              },
              "grid": {
                "left": "5%",
                "right": "55%",
                "bottom": "14%",
                "top": "16%"
              },
              "xAxis": {
                "type": "value",
                "name": "贡献度(%)",
                "nameTextStyle": {
                  "fontSize": 11
                },
                "gridIndex": 0
              },
              "yAxis": {
                "type": "category",
                "data": [
                  "port_15",
                  "port_9",
                  "port_5",
                  "port_12",
                  "port_19",
                  "port_8",
                  "port_7",
                  "port_4",
                  "port_1",
                  "port_17"
                ],
                "inverse": true,
                "axisLabel": {
                  "fontSize": 10
                },
                "gridIndex": 0
              },
              "series": [
                {
                  "name": "贡献度",
                  "type": "bar",
                  "data": [
                    {
                      "value": -21.23,
                      "itemStyle": {
                        "color": "#e76f6f"
                      }
                    },
                    {
                      "value": -12.7,
                      "itemStyle": {
                        "color": "#e76f6f"
                      }
                    },
                    {
                      "value": -9.26,
                      "itemStyle": {
                        "color": "#e76f6f"
                      }
                    },
                    {
                      "value": -6.8,
                      "itemStyle": {
                        "color": "#e76f6f"
                      }
                    },
                    {
                      "value": 0.26,
                      "itemStyle": {
                        "color": "#6bc78e"
                      }
                    },
                    {
                      "value": 4.19,
                      "itemStyle": {
                        "color": "#6bc78e"
                      }
                    },
                    {
                      "value": 6.09,
                      "itemStyle": {
                        "color": "#6bc78e"
                      }
                    },
                    {
                      "value": 8.42,
                      "itemStyle": {
                        "color": "#6bc78e"
                      }
                    },
                    {
                      "value": 14.27,
                      "itemStyle": {
                        "color": "#6bc78e"
                      }
                    },
                    {
                      "value": 16.78,
                      "itemStyle": {
                        "color": "#6bc78e"
                      }
                    }
                  ],
                  "barMaxWidth": 24,
                  "xAxisIndex": 0,
                  "yAxisIndex": 0,
                  "label": {
                    "show": true,
                    "position": "right",
                    "fontSize": 10,
                    "formatter": "{c}%"
                  }
                },
                {
                  "name": "占比",
                  "type": "pie",
                  "radius": [
                    "30%",
                    "55%"
                  ],
                  "center": [
                    "75%",
                    "50%"
                  ],
                  "data": [
                    {
                      "name": "port_15",
                      "value": 21.23
                    },
                    {
                      "name": "port_9",
                      "value": 12.7
                    },
                    {
                      "name": "port_5",
                      "value": 9.26
                    },
                    {
                      "name": "port_12",
                      "value": 6.8
                    },
                    {
                      "name": "port_8",
                      "value": 4.19
                    },
                    {
                      "name": "port_7",
                      "value": 6.09
                    },
                    {
                      "name": "port_4",
                      "value": 8.42
                    },
                    {
                      "name": "port_1",
                      "value": 14.27
                    }
                  ],
                  "label": {
                    "fontSize": 10,
                    "formatter": "{b}\n{d}%"
                  },
                  "itemStyle": {
                    "borderRadius": 4,
                    "borderWidth": 1,
                    "borderColor": "#fff"
                  },
                  "color": [
                    "#7eb8da",
                    "#f2918c",
                    "#8fd4b0",
                    "#f5c378",
                    "#b8a9e0",
                    "#7ecdc0",
                    "#e8a0bf",
                    "#a3d9e8",
                    "#f0b88a",
                    "#c5e0a5"
                  ]
                }
              ]
            },
            "phaseId": 2,
            "stepId": 2
          }
        ],

