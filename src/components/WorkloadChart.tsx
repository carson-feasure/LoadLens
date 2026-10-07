import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type LabelProps } from 'recharts'
import { ChevronDown } from 'lucide-react'
import { courseMap, demoData } from '../domain/data'
import { assessmentKindLabel, courseWeekContribution, formatHours, planMetrics } from '../domain/calculations'
import { weekLabel } from '../domain/dates'

interface WorkloadChartProps {
  courseIds: string[]; selectedWeek?: number; onSelectWeek?: (week: number) => void
  threshold?: number; compact?: boolean; yMax?: number; showTable?: boolean; ariaLabel?: string
}

function CourseBarLabel({ viewBox, value, code }: LabelProps & { code: string }) {
  if (!viewBox || !('x' in viewBox)) return null
  const { x = 0, y = 0, width = 0, height = 0 } = viewBox
  const hours = Number(value)
  if (!hours || width < 11 || height < 17) return null
  const [subject, number] = code.split(' ')
  const centerX = x + width / 2
  const centerY = y + height / 2
  return <text className="bar-course-label" data-course-code={code} x={centerX} y={centerY} textAnchor="middle" aria-hidden="true">
    <tspan x={centerX} dy="-0.15em">{subject}</tspan>
    {number && <tspan x={centerX} dy="1em">{number}</tspan>}
  </text>
}

export function WorkloadChart({ courseIds, selectedWeek = 7, onSelectWeek, threshold, compact = false, yMax, showTable = true, ariaLabel = 'Weekly study workload' }: WorkloadChartProps) {
  const [tableOpen, setTableOpen] = useState(false)
  const ids = [...new Set(courseIds)].filter((id) => courseMap.has(id))
  const metrics = planMetrics(ids, threshold ?? Number.POSITIVE_INFINITY)
  const data = Array.from({ length: 15 }, (_, index) => {
    const week = index + 1
    return { week, label: `W${week}`, total: metrics.weeklyTotals[index] ?? 0, ...Object.fromEntries(ids.map((id) => [id, courseWeekContribution(id, week).totalHours])) }
  })
  const selectedTotal = metrics.weeklyTotals[selectedWeek - 1] ?? 0
  const selectedRows = ids.map((id) => {
    const contribution = courseWeekContribution(id, selectedWeek)
    const assessments = contribution.assessmentIds.map((assessmentId) => demoData.assessments.find((item) => item.id === assessmentId)).filter((item) => item != null)
    return { course: courseMap.get(id)!, contribution, assessments }
  })
  if (!ids.length) return <div className="chart-empty"><span>No courses in this plan yet.</span><span>Add courses to see a 15-week workload.</span></div>

  return <div className={compact ? 'workload-chart compact' : 'workload-chart'}>
    {onSelectWeek && <p className="chart-instruction"><strong>Select a week:</strong> click any stacked bar or use the controls below. Course names, hours, and major work for the selected stack stay visible without hovering.</p>}
    <div className="chart-visual" role="img" aria-label={`${ariaLabel}. Peak ${formatHours(metrics.peakHours)} hrs in ${metrics.peakWeeks.map((week) => `week ${week}`).join(', ')}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: compact ? 4 : 12, left: compact ? -22 : 10, bottom: compact ? 4 : 28 }} onClick={(event) => {
          const week = Number(event?.activePayload?.[0]?.payload?.week)
          if (week && onSelectWeek) onSelectWeek(week)
        }}>
          <CartesianGrid stroke="#eee4dc" strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#7a706c', fontSize: compact ? 9 : 11 }} interval={compact ? 2 : 'preserveStartEnd'} minTickGap={12} axisLine={false} tickLine={false} label={compact ? undefined : { value: 'Semester week', position: 'insideBottom', offset: -12, fill: '#645a56', fontSize: 11 }} />
          <YAxis domain={[0, yMax ?? 'auto']} tick={{ fill: '#7a706c', fontSize: compact ? 9 : 11 }} axisLine={false} tickLine={false} width={compact ? 24 : 54} label={compact ? undefined : { value: 'Study workload (hrs)', angle: -90, position: 'insideLeft', fill: '#645a56', fontSize: 11 }} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const datum = payload[0]?.payload as { week: number; total: number } & Record<string, number>
            return <div className="chart-tooltip"><strong>Week {datum.week} · {formatHours(datum.total)} hrs</strong><span>{weekLabel(datum.week)}</span>{ids.map((id) => <span key={id}><i style={{ background: courseMap.get(id)!.color }} />{courseMap.get(id)!.code}: {formatHours(datum[id] ?? 0)} hrs</span>)}</div>
          }} />
          {threshold != null && <ReferenceLine y={threshold} stroke="#a61d2d" strokeDasharray="5 4" label={compact ? undefined : { value: `${formatHours(threshold)} hrs limit`, position: 'insideTopRight', fill: '#8c1725', fontSize: 11 }} />}
          {ids.map((id, index) => {
            const course = courseMap.get(id)!
            return <Bar key={id} dataKey={id} stackId="workload" fill={course.color} radius={index === ids.length - 1 ? [3, 3, 0, 0] : 0} maxBarSize={compact ? 18 : 34} isAnimationActive={false}>
              {data.map((entry) => {
                const isSelected = entry.week === selectedWeek
                const isAboveLimit = threshold != null && entry.total > threshold
                return <Cell key={`${id}-${entry.week}`} cursor={onSelectWeek ? 'pointer' : 'default'} opacity={isSelected || isAboveLimit ? 1 : .72} stroke={isSelected ? '#352d2b' : isAboveLimit ? '#a61d2d' : 'none'} strokeWidth={isSelected ? 2 : isAboveLimit ? 1.25 : 0} />
              })}
              {!compact && <LabelList dataKey={id} position="center" content={(props: LabelProps) => <CourseBarLabel {...props} code={course.code} />} />}
            </Bar>
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
    {compact && <p className="chart-axis-caption">Semester week · Study workload (hrs)</p>}
    {!compact && onSelectWeek && <section className="selected-stack-summary" aria-label={`Selected stack for Week ${selectedWeek}`}>
      <div className="selected-stack-heading"><div><span>SELECTED STACK</span><strong>Week {selectedWeek} · {formatHours(selectedTotal)} hrs</strong></div><div className="selected-stack-flags">{metrics.peakWeeks.includes(selectedWeek) && <em>PEAK WEEK</em>}{threshold != null && selectedTotal > threshold && <em>ABOVE LIMIT</em>}</div></div>
      <div className="selected-stack-courses">{selectedRows.map(({ course, contribution, assessments }) => <article key={course.id} style={{ borderTopColor: course.color }}>
        <div><strong>{course.code}</strong><span>{formatHours(contribution.totalHours)} hrs</span></div>
        <p>{course.title}</p>
        {assessments.length ? <small>{assessments.map((item) => `${assessmentKindLabel(item.kind)} · ${item.title}`).join(' + ')}</small> : <small>Recurring study only</small>}
      </article>)}</div>
    </section>}
    <ul className="course-legend" aria-label="Course color legend">{ids.map((id) => {
      const course = courseMap.get(id)!
      return <li key={id}><i style={{ backgroundColor: course.color }} /><span><strong>{course.code}</strong>{course.title}</span></li>
    })}</ul>
    {threshold != null && <div className={metrics.highWorkloadWeeks.length ? 'above-limit-summary' : 'above-limit-summary neutral'}>
      <div><strong>{metrics.highWorkloadWeeks.length ? 'Above limit' : 'No weeks above limit'}</strong><span>{metrics.highWorkloadWeeks.length ? `${metrics.highWorkloadWeeks.length} week${metrics.highWorkloadWeeks.length === 1 ? '' : 's'} exceed ${formatHours(threshold)} hrs` : `All modeled weeks are at or below ${formatHours(threshold)} hrs`}</span></div>
      {metrics.highWorkloadWeeks.length > 0 && <div className="above-limit-weeks">{metrics.highWorkloadWeeks.map((week) => onSelectWeek ? <button type="button" key={week} className={week === selectedWeek ? 'selected' : ''} aria-pressed={week === selectedWeek} onClick={() => onSelectWeek(week)}>Week {week}<span>{formatHours(metrics.weeklyTotals[week - 1]!)} hrs</span><small>{metrics.peakWeeks.includes(week) ? 'PEAK WEEK · ABOVE LIMIT' : 'ABOVE LIMIT'}</small></button> : <span key={week}>Week {week} · {formatHours(metrics.weeklyTotals[week - 1]!)} hrs</span>)}</div>}
    </div>}
    {onSelectWeek && <label className="week-select-label">Select a semester week to inspect
      <select value={selectedWeek} onChange={(event) => onSelectWeek(Number(event.target.value))}>{data.map((item) => <option key={item.week} value={item.week}>Week {item.week} · {formatHours(item.total)} hrs · {weekLabel(item.week)}</option>)}</select>
    </label>}
    {showTable && <div className="chart-table-disclosure">
      <button type="button" onClick={() => setTableOpen((open) => !open)} aria-expanded={tableOpen}>View data table <ChevronDown className={tableOpen ? 'rotate' : ''} /></button>
      {tableOpen && <div className="table-scroll"><table><caption>Study workload for all 15 illustrative weeks (hrs)</caption><thead><tr><th>Week</th>{ids.map((id) => <th key={id}>{courseMap.get(id)!.code}</th>)}<th>Total</th></tr></thead><tbody>{data.map((item) => <tr key={item.week}><th>Week {item.week}</th>{ids.map((id) => <td key={id}>{formatHours(Number(item[id as keyof typeof item]))} hrs</td>)}<td><strong>{formatHours(item.total)} hrs</strong></td></tr>)}</tbody></table></div>}
    </div>}
  </div>
}
