(function () {
  'use strict';

  var targetSelector = 'button[data-hidden-action-tooltip]';
  var tooltipId = 'ecmisHiddenActionTooltip';
  var tooltip = null;
  var activeTarget = null;
  var previousDescribedBy = null;

  function ensureTooltip() {
    if (tooltip) return tooltip;

    var style = document.createElement('style');
    style.textContent = [
      '.ecmis-hidden-action-tooltip{position:fixed;z-index:2147483647;max-width:min(360px,calc(100vw - 24px));padding:9px 12px;border:1px solid rgba(230,199,101,.72);border-radius:9px;background:#0a2647;color:#fff;box-shadow:0 8px 24px rgba(5,20,37,.28);font-family:"Sarabun","Noto Sans Thai",sans-serif;font-size:12px;font-weight:600;line-height:1.55;text-align:left;pointer-events:none}',
      '.ecmis-hidden-action-tooltip[hidden]{display:none}'
    ].join('');
    document.head.appendChild(style);

    tooltip = document.createElement('div');
    tooltip.id = tooltipId;
    tooltip.className = 'ecmis-hidden-action-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.hidden = true;
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function findTarget(node) {
    return node && node.closest ? node.closest(targetSelector) : null;
  }

  function restoreDescription() {
    if (!activeTarget) return;
    if (previousDescribedBy === null) activeTarget.removeAttribute('aria-describedby');
    else activeTarget.setAttribute('aria-describedby', previousDescribedBy);
  }

  function hideTooltip() {
    if (!tooltip || tooltip.hidden) return;
    restoreDescription();
    tooltip.hidden = true;
    activeTarget = null;
    previousDescribedBy = null;
  }

  function positionTooltip(target, pointerEvent) {
    if (!tooltip || tooltip.hidden || !target) return;

    var targetRect = target.getBoundingClientRect();
    var tooltipRect = tooltip.getBoundingClientRect();
    var hasPointer = pointerEvent && Number.isFinite(pointerEvent.clientX) && Number.isFinite(pointerEvent.clientY);
    var anchorX = hasPointer ? pointerEvent.clientX : targetRect.left + targetRect.width / 2;
    var anchorY = hasPointer ? pointerEvent.clientY : targetRect.bottom;
    var left = anchorX - tooltipRect.width / 2;
    var top = anchorY + 14;
    var viewportMargin = 12;

    left = Math.max(viewportMargin, Math.min(left, window.innerWidth - tooltipRect.width - viewportMargin));
    if (top + tooltipRect.height > window.innerHeight - viewportMargin) {
      top = (hasPointer ? pointerEvent.clientY : targetRect.top) - tooltipRect.height - 14;
    }
    top = Math.max(viewportMargin, top);

    tooltip.style.left = Math.round(left) + 'px';
    tooltip.style.top = Math.round(top) + 'px';
  }

  function showTooltip(target, pointerEvent) {
    if (!target) return;
    var message = target.getAttribute('data-hidden-action-tooltip') || target.getAttribute('aria-label');
    if (!message) return;

    if (activeTarget === target && tooltip && !tooltip.hidden) {
      tooltip.textContent = message;
      positionTooltip(target, pointerEvent);
      return;
    }
    if (activeTarget && activeTarget !== target) hideTooltip();
    ensureTooltip();
    activeTarget = target;
    previousDescribedBy = target.getAttribute('aria-describedby');
    var describedBy = (previousDescribedBy || '').split(/\s+/).filter(Boolean);
    if (describedBy.indexOf(tooltipId) < 0) describedBy.push(tooltipId);
    target.setAttribute('aria-describedby', describedBy.join(' '));
    tooltip.textContent = message;
    tooltip.hidden = false;
    positionTooltip(target, pointerEvent);
  }

  function bindTooltipEvents() {
    ensureTooltip();

    document.addEventListener('pointerover', function (event) {
      var target = findTarget(event.target);
      if (target) showTooltip(target, event);
    });
    document.addEventListener('pointermove', function (event) {
      if (activeTarget && findTarget(event.target) === activeTarget) positionTooltip(activeTarget, event);
    });
    document.addEventListener('pointerout', function (event) {
      var target = findTarget(event.target);
      if (target && target === activeTarget && (!event.relatedTarget || !target.contains(event.relatedTarget))) hideTooltip();
    });
    document.addEventListener('focusin', function (event) {
      var target = findTarget(event.target);
      if (target) showTooltip(target);
    });
    document.addEventListener('focusout', function (event) {
      if (findTarget(event.target) === activeTarget) hideTooltip();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') hideTooltip();
    });
    document.addEventListener('scroll', hideTooltip, true);
    window.addEventListener('resize', hideTooltip);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindTooltipEvents, { once: true });
  else bindTooltipEvents();
})();
