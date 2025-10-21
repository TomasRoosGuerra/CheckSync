import { useState } from "react";
import { useStore } from "../store";
import type { Label, LabelProperty } from "../types";

interface LabelManagementProps {
  onClose: () => void;
}

const LABEL_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F59E0B" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Gray", value: "#6B7280" },
];

export default function LabelManagement({ onClose }: LabelManagementProps) {
  const { labels, currentWorkspace, user, addLabel, updateLabel, deleteLabel } =
    useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0].value);
  const [labelProperties, setLabelProperties] = useState<LabelProperty[]>([]);

  const workspaceLabels = labels.filter(
    (label) => label.workspaceId === currentWorkspace?.id
  );

  // Label property management functions
  const addProperty = () => {
    const newProperty: LabelProperty = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "text",
      name: "",
      required: false,
      options: {},
    };
    setLabelProperties([...labelProperties, newProperty]);
  };

  const updateProperty = (index: number, updates: Partial<LabelProperty>) => {
    const updated = [...labelProperties];
    updated[index] = { ...updated[index], ...updates };
    setLabelProperties(updated);
  };

  const removeProperty = (index: number) => {
    setLabelProperties(labelProperties.filter((_, i) => i !== index));
  };

  const renderPropertyInput = (property: LabelProperty, index: number) => {
    return (
      <div
        key={property.id}
        className="bg-gray-50 p-3 rounded-lg border border-gray-200"
      >
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            value={property.name}
            onChange={(e) => updateProperty(index, { name: e.target.value })}
            placeholder="Property name (e.g., Priority, Room)"
            className="input-field text-sm"
          />
          <select
            value={property.type}
            onChange={(e) =>
              updateProperty(index, {
                type: e.target.value as "text" | "number" | "range",
              })
            }
            className="input-field text-sm"
          >
            <option value="text">Text Input</option>
            <option value="number">Number Input</option>
            <option value="range">Number Range</option>
          </select>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={property.required || false}
              onChange={(e) =>
                updateProperty(index, { required: e.target.checked })
              }
              className="w-3 h-3"
            />
            Required
          </label>
        </div>

        {property.type === "text" && (
          <input
            type="text"
            value={property.options?.placeholder || ""}
            onChange={(e) =>
              updateProperty(index, {
                options: { ...property.options, placeholder: e.target.value },
              })
            }
            placeholder="Placeholder text"
            className="input-field text-sm"
          />
        )}

        {property.type === "number" && (
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              value={property.options?.min || ""}
              onChange={(e) =>
                updateProperty(index, {
                  options: {
                    ...property.options,
                    min: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="Min"
              className="input-field text-sm"
            />
            <input
              type="number"
              value={property.options?.max || ""}
              onChange={(e) =>
                updateProperty(index, {
                  options: {
                    ...property.options,
                    max: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="Max"
              className="input-field text-sm"
            />
            <input
              type="number"
              value={property.options?.step || ""}
              onChange={(e) =>
                updateProperty(index, {
                  options: {
                    ...property.options,
                    step: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="Step"
              className="input-field text-sm"
            />
          </div>
        )}

        {property.type === "range" && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={property.options?.min || ""}
              onChange={(e) =>
                updateProperty(index, {
                  options: {
                    ...property.options,
                    min: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="Min value"
              className="input-field text-sm"
            />
            <input
              type="number"
              value={property.options?.max || ""}
              onChange={(e) =>
                updateProperty(index, {
                  options: {
                    ...property.options,
                    max: parseInt(e.target.value) || undefined,
                  },
                })
              }
              placeholder="Max value"
              className="input-field text-sm"
            />
          </div>
        )}

        <button
          onClick={() => removeProperty(index)}
          className="mt-2 text-red-500 hover:text-red-700 text-xs"
        >
          🗑️ Remove Property
        </button>
      </div>
    );
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !currentWorkspace || !user) return;

    const newLabel: Label = {
      id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workspaceId: currentWorkspace.id,
      name: newLabelName.trim(),
      color: newLabelColor,
      createdBy: user.id,
      createdAt: Date.now(),
      properties: labelProperties.filter((prop) => prop.name.trim() !== ""),
    };

    addLabel(newLabel);
    setNewLabelName("");
    setNewLabelColor(LABEL_COLORS[0].value);
    setLabelProperties([]);
    setShowCreateForm(false);
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel || !newLabelName.trim()) return;

    updateLabel(editingLabel.id, {
      name: newLabelName.trim(),
      color: newLabelColor,
      properties: labelProperties.filter((prop) => prop.name.trim() !== ""),
    });

    setEditingLabel(null);
    setNewLabelName("");
    setNewLabelColor(LABEL_COLORS[0].value);
    setLabelProperties([]);
  };

  const handleDeleteLabel = (labelId: string) => {
    if (window.confirm("Are you sure you want to delete this label?")) {
      deleteLabel(labelId);
    }
  };

  const startEditing = (label: Label) => {
    setEditingLabel(label);
    setNewLabelName(label.name);
    setNewLabelColor(label.color);
    setLabelProperties(label.properties || []);
    setShowCreateForm(true);
  };

  const cancelEditing = () => {
    setEditingLabel(null);
    setNewLabelName("");
    setNewLabelColor(LABEL_COLORS[0].value);
    setLabelProperties([]);
    setShowCreateForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Manage Labels</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Create/Edit Form */}
            {showCreateForm && (
              <div className="card bg-blue-50 border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingLabel ? "Edit Label" : "Create New Label"}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Label Name
                    </label>
                    <input
                      type="text"
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      className="input-field"
                      placeholder="e.g., Important, Meeting, Training"
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {LABEL_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setNewLabelColor(color.value)}
                          className={`w-10 h-10 rounded-lg border-2 transition-all ${
                            newLabelColor === color.value
                              ? "border-gray-900 shadow-lg scale-110"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Label Properties Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Properties (optional)
                      </label>
                      <button
                        type="button"
                        onClick={addProperty}
                        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded"
                      >
                        + Add Property
                      </button>
                    </div>

                    {labelProperties.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {labelProperties.map((property, index) =>
                          renderPropertyInput(property, index)
                        )}
                      </div>
                    )}

                    {labelProperties.length === 0 && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded border border-gray-200">
                        Add custom properties like priority levels, room
                        numbers, or any other data you want to track with this
                        label.
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={
                        editingLabel ? handleUpdateLabel : handleCreateLabel
                      }
                      className="btn-primary flex-1"
                      disabled={!newLabelName.trim()}
                    >
                      {editingLabel ? "✓ Update Label" : "✓ Create Label"}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="btn-secondary px-6"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Labels List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Workspace Labels ({workspaceLabels.length})
                </h3>
                {!showCreateForm && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    + Add Label
                  </button>
                )}
              </div>

              {workspaceLabels.length === 0 ? (
                <div className="card text-center py-8">
                  <div className="text-4xl mb-2">🏷️</div>
                  <p className="text-gray-600 mb-2">No labels created yet</p>
                  <p className="text-sm text-gray-500">
                    Create labels to organize your time slots
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {workspaceLabels.map((label) => (
                    <div
                      key={label.id}
                      className="card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="font-medium text-gray-900">
                          {label.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(label)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit label"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteLabel(label.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete label"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Usage Info */}
            <div className="card bg-gray-50 border-gray-200">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    How to use labels
                  </h4>
                  <p className="text-sm text-gray-600">
                    Labels help you categorize and organize your time slots. You
                    can assign labels when creating or editing slots to make
                    them easier to find and filter.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
