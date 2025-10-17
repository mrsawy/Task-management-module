<?php

namespace App\Models\Traits;

/**
 * ERP Integration Trait
 * Enables tasks to link with inventory, purchase orders, and operations
 * Use Case: Stock management, procurement tasks, operations workflow
 */
trait ERPTaskTrait
{

    /**
     * Link task to inventory item
     */
    public function linkToInventoryItem(string $itemId, ?string $itemName = null, ?int $quantity = null)
    {
        $this->meta = $this->meta ?? [];
        $this->meta['erp_inventory_id'] = $itemId;
        $this->meta['erp_inventory_name'] = $itemName;
        $this->meta['erp_quantity'] = $quantity;
        $this->meta['erp_context'] = 'inventory_task';
        $this->save();
        return $this;
    }

    /**
     * Link task to purchase order
     */
    public function linkToPurchaseOrder(string $poId, ?float $poAmount = null)
    {
        $this->meta = $this->meta ?? [];
        $this->meta['erp_po_id'] = $poId;
        $this->meta['erp_po_amount'] = $poAmount;
        $this->meta['erp_context'] = 'purchase_task';
        $this->save();
        return $this;
    }

    /**
     * Mark as procurement task
     */
    public function markAsProcurementTask(string $procurementType = 'purchase')
    {
        $this->meta = $this->meta ?? [];
        $this->meta['erp_type'] = 'procurement';
        $this->meta['procurement_type'] = $procurementType; // purchase, approval, delivery, inspection
        $this->save();
        return $this;
    }

    /**
     * Get ERP context
     */
    public function getERPContext()
    {
        return $this->meta['erp_context'] ?? null;
    }

    /**
     * Get linked inventory ID
     */
    public function getLinkedInventoryId()
    {
        return $this->meta['erp_inventory_id'] ?? null;
    }

    /**
     * Get linked PO ID
     */
    public function getLinkedPOId()
    {
        return $this->meta['erp_po_id'] ?? null;
    }
}
