import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

const Settings = ({ onClose }) => {
  const [riskSensitivity, setRiskSensitivity] = useState(2);
  const [alertFrequency, setAlertFrequency] = useState(45);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // loading state

  useEffect(() => {
    axios.get(`${API_URL}/config/settings`, { withCredentials: true })
      .then(res => {
        const { risk_sensitivity, alert_frequency } = res.data;
        setRiskSensitivity(risk_sensitivity || 2);
        setAlertFrequency(alert_frequency || 45);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.post(`${API_URL}/config/settings`, {
        risk_sensitivity: riskSensitivity,
        alert_frequency: alertFrequency,
      }, {
        withCredentials: true,
      });
      toast.success("Settings saved successfully!");
    } catch {
      toast.error("Error saving settings");
    } finally {
      setIsSaving(false);
      if (onClose) onClose();
    }
  };

  return (
    <div className="bg-neutral-100 p-8 rounded-md flex justify-center items-center min-h-[300px]">
      {isLoading ? (
        <div className="w-[600px] h-[300px] space-y-4 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-5 bg-gray-300 rounded w-1/2" />
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-6 pr-10">Settings</h1>
          <Card className="rounded-xl shadow-sm border border-blue-100 bg-white max-w-xl w-full">
            <CardContent className="p-6 space-y-8">
              {/* Risk Sensitivity */}
              <div>
                <Label className="text-lg">Risk Sensitivity</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Adjust how sensitive the system should be in evaluating risky locations.
                </p>
                <Slider
                  min={1}
                  max={3}
                  step={1}
                  value={[riskSensitivity]}
                  onValueChange={([val]) => setRiskSensitivity(val)}
                  className="w-full"
                  trackClassName="bg-gray-300 h-2 rounded-full"
                  rangeClassName="bg-blue-500 h-2 rounded-full"
                  thumbClassName="h-5 w-5 bg-white border-2 border-blue-500 shadow"
                />
                <p className="mt-2 text-sm font-medium text-gray-700">
                  {["Low", "Medium", "High"][riskSensitivity - 1]}
                </p>
              </div>

              {/* Alert Frequency */}
              <div>
                <Label className="text-lg">Alert Frequency (seconds)</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Choose how often the system should alert you about safety updates.
                </p>
                <Slider
                  min={5}
                  max={60}
                  step={5}
                  value={[alertFrequency]}
                  onValueChange={([val]) => setAlertFrequency(val)}
                  className="w-full"
                  trackClassName="bg-gray-300 h-2 rounded-full"
                  rangeClassName="bg-blue-500 h-2 rounded-full"
                  thumbClassName="h-5 w-5 bg-white border-2 border-blue-500 shadow"
                />
                <p className="mt-2 text-sm font-medium text-gray-700">
                  Every {alertFrequency} seconds
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Settings;
