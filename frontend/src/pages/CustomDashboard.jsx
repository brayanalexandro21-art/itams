import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CustomDashboard = () => {
  const [widgets, setWidgets] = useState([]);
  const [availableWidgets, setAvailableWidgets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWidgets();
    fetchAvailableWidgets();
  }, []);

  const fetchWidgets = async () => {
    try {
      const response = await api.get('/dashboard-custom/widgets');
      setWidgets(response.data);
    } catch (error) {
      console.error('Error fetching widgets:', error);
    }
  };

  const fetchAvailableWidgets = async () => {
    try {
      const response = await api.get('/dashboard-custom/available');
      setAvailableWidgets(response.data);
    } catch (error) {
      console.error('Error fetching available widgets:', error);
    }
  };

  const addWidget = async (widgetType) => {
    try {
      const widget = availableWidgets.find(w => w.type === widgetType);
      const newWidgets = [...widgets, { type: widgetType, title: widget.name, config: {} }];
      await api.put('/dashboard-custom/widgets', { widgets: newWidgets });
      setWidgets(newWidgets);
    } catch (error) {
      console.error('Error adding widget:', error);
    }
  };

  const removeWidget = async (index) => {
    try {
      const newWidgets = widgets.filter((_, i) => i !== index);
      await api.put('/dashboard-custom/widgets', { widgets: newWidgets });
      setWidgets(newWidgets);
    } catch (error) {
      console.error('Error removing widget:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Personalizado</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Widgets Disponibles</h2>
        <div className="flex flex-wrap gap-2">
          {availableWidgets.map(widget => (
            <button
              key={widget.type}
              onClick={() => addWidget(widget.type)}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
            >
              {widget.icon} {widget.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Widgets en Dashboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {widgets.map((widget, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">{widget.title}</h3>
                <button
                  onClick={() => removeWidget(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
              <div className="text-gray-500 text-sm">
                Widget tipo: {widget.type}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomDashboard;
