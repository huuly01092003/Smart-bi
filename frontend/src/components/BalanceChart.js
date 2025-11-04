import React from 'react';
import ReactECharts from 'echarts-for-react';

function BalanceChart({ data }) {
    if (!data || data.length === 0) {
        return <div className="p-3 border rounded text-center">Chưa có dữ liệu Cân bằng tải để hiển thị.</div>;
    }

    const categories = data.map(item => item['Mã nhân viên phụ trách']);
    const tongKH = data.map(item => item.Tong_KH);
    const tongCalls = data.map(item => item.Tong_Calls);

    // Lấy giá trị Min/Max (Giả định tất cả tuyến dùng chung 1 ngưỡng)
    const khMin = data[0].KH_Min;
    const khMax = data[0].KH_Max;
    const callMin = data[0].Call_Min;
    const callMax = data[0].Call_Max;

    const option = {
        title: { text: 'Cân bằng Tải (KH & Calls)', left: 'center' },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['Tổng KH', 'Tổng Calls'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: { type: 'category', data: categories, axisLabel: { rotate: 45 } },
        yAxis: [
            { type: 'value', name: 'Số KH', min: 0 },
            { type: 'value', name: 'Số Calls', min: 0 }
        ],
        series: [
            {
                name: 'Tổng KH',
                type: 'bar',
                data: tongKH,
                yAxisIndex: 0,
                markLine: {
                    data: [
                        { yAxis: khMin, name: 'KH Min', lineStyle: { color: 'red', type: 'dashed' } },
                        { yAxis: khMax, name: 'KH Max', lineStyle: { color: 'red', type: 'dashed' } }
                    ]
                }
            },
            {
                name: 'Tổng Calls',
                type: 'bar',
                data: tongCalls,
                yAxisIndex: 1,
                markLine: {
                    data: [
                        { yAxis: callMin, name: 'Call Min', lineStyle: { color: 'blue', type: 'dashed' } },
                        { yAxis: callMax, name: 'Call Max', lineStyle: { color: 'blue', type: 'dashed' } }
                    ]
                }
            }
        ]
    };

    return (
        <div className="p-3 border rounded">
            <ReactECharts option={option} style={{ height: '400px' }} />
            <p className="small text-muted mt-2">Đường màu đỏ: KH Min/Max. Đường màu xanh: Call Min/Max.</p>
        </div>
    );
}

export default BalanceChart;