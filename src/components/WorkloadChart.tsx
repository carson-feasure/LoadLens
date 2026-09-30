import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChevronDown } from 'lucide-react'
import { courseMap } from '../domain/data'
import { courseWeekContribution, planMetrics } from '../domain/calculations'
import { weekLabel } from '../domain/dates'

interface WorkloadChartProps {
  courseIds: string[]; selectedWeek?: number; onSelectWeek?: (week: number) => void
  threshold?: number; compact?: boolean; yMax?: number; showTable?: boolean; ariaLabel?: string
}

export function WorkloadChart({ courseIds, selectedWeek = 7, onSelectWeek, threshold, compact = false, yMax, showTable = true, ariaLabel = 'Weekly study workload' }: WorkloadChartProps) {
  const [tableOpen, setTableOpen] = useState(false)
  const ids = [...new Set(courseIds)].filter((id) => courseMap.has(id))
  const metrics = planMetrics(ids, threshold ?? Number.POSITIVE_INFINITY)
  const data = Array.from({ length: 15 }, (_, index) => {
    const week = index + 1
    return { week, label: `W${week}`, total: metrics.weeklyTotals[index], ...Object.fromEntries(ids.map((id) => [id, courseWeekContribution(id, week).totalHours])) }
  })
  const active = ids.length > 0
  if (!active) return <div className="chart-empty"><span>No courses in this plan yet.</span><span>Add courses to see a 15-week workload.</span></div>
  return <div className={compact ? 'workload-chart compact' : 'workload-chart'}>
    <div className="chart-visual" role="img" aria-label={`${ariaLabel}. Peak ${metrics.peakHours} hours in ${metrics.peakWeeks.map((week) => `week ${week}`).join(', ')}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 14, right: compact ? 4 : 10, left: compact ? -24 : -8, bottom: 2 }} onClick={(event) => {
          const week = Number(event?.activePayload?.[0]?.payload?.week)
          if (week && onSelectWeek) onSelectWeek(week)
        }}>
          <CartesianGrid stroke="#eee4dc" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#7a706c', fontSize: compact ? 9 : 11 }} interval={compact ? 2 : 'preserveStartEnd'} minTickGap={12} axisLine={false} tickLine={false} />
          <YAxis domain={[0, yMax ?? 'auto']} tick={{ fill: '#7a706c', fontSize: compact ? 9 : 11 }} axisLine={false} tickLine={false} width={compact ? 24 : 38} label={compact ? undefined : { value: 'Hours', angle: -90, position: 'insideLeft', fill: '#7a706c', fontSize: 11 }} />
          <Tooltip content={({ active: tipActive, payload }) => {
            if (!tipActive || !payload?.length) return null
            const datum = payload[0]?.payload as { week: number; total: number }
            return <div className="chart-tooltip"><strong>Week {datum.week} · {datum.total} h</strong><span>{weekLabel(datum.week)}</span>{ids.map((id) => <span key={id}><i style={{ background: courseMap.get(id)!.color }} />{courseMap.get(id)!.code}: {datum[id as keyof typeof datum]} h</span>)}</div>
          }} />
          {!compact && <Legend iconType="circle" iconSize={7} formatter={(value) => <span className="legend-label">{courseMap.get(value)?.code ?? value}</span>} />}
          {threshold != null && <ReferenceLine y={threshold} stroke="#a61d2d" strokeDasharray="5 4" label={compact ? undefined : { value: `${threshold} h limit`, position: 'insideTopRight', fill: '#8c1725', fontSize: 11 }} />}
          {ids.map((id, index) => <Bar key={id} dataKey={id} stackId="workload" fill={courseMap.get(id)!.color} radius={index === ids.length - 1 ? [3, 3, 0, 0] : 0} maxBarSize={compact ? 18 : 34} isAnimationActive={false}>
            {data.map((entry) => <Cell key={`${id}-${entry.week}`} cursor={onSelectWeek ? 'pointer' : 'default'} opacity={entry.week === selectedWeek ? 1 : .78} stroke={entry.week === selectedWeek ? '#352d2b' : 'none'} strokeWidth={entry.week === selectedWeek ? 1.5 : 0} />)}
          </Bar>)}
        </BarChart>
      </ResponsiveContainer>
    </div>
    {onSelectWeek && <label className="week-select-label">Inspect week
      <select value={selectedWeek} onChange={(event) => onSelectWeek(Number(event.target.value))}>{data.map((item) => <option key={item.week} value={item.week}>Week {item.week} · {item.total} h · {weekLabel(item.week)}</option>)}</select>
    </label>}
    {showTable && <div className="chart-table-disclosure">
      <button type="button" onClick={() => setTableOpen((open) => !open)} aria-expanded={tableOpen}>View data table <ChevronDown className={tableOpen ? 'rotate' : ''} /></button>
      {tableOpen && <div className="table-scroll"><table><caption>Study hours for all 15 illustrative weeks</caption><thead><tr><th>Week</th>{ids.map((id) => <th key={id}>{courseMap.get(id)!.code}</th>)}<th>Total</th></tr></thead><tbody>{data.map((item) => <tr key={item.week}><th>Week {item.week}</th>{ids.map((id) => <td key={id}>{item[id as keyof typeof item]} h</td>)}<td><strong>{item.total} h</strong></td></tr>)}</tbody></table></div>}
    </div>}
  </div>
}
