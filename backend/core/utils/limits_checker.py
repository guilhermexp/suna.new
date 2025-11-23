"""
Subscription limit checking utilities.

Handles checking various limits based on user tier:
- Agent run limits
- Agent count limits  
- Project count limits
"""
from typing import Dict, Any
from datetime import datetime, timezone, timedelta
from core.utils.logger import logger
from core.utils.config import config
from core.utils.cache import Cache


async def check_agent_run_limit(client, account_id: str) -> Dict[str, Any]:
    """
    Check if the account has reached the limit of parallel agent runs within the past 24 hours.
    
    Args:
        client: Database client
        account_id: Account ID to check
        
    Returns:
        Dict with 'can_start' (bool), 'running_count' (int), 'running_thread_ids' (list)
        
    Note: This function does not use caching to ensure real-time limit checks.
    """
    try:
        # Calculate 24 hours ago
        twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
        twenty_four_hours_ago_iso = twenty_four_hours_ago.isoformat()
        
        logger.debug(f"Checking agent run limit for account {account_id} since {twenty_four_hours_ago_iso}")
        
        # Get all threads for this account
        threads_result = await client.table('threads').select('thread_id').eq('account_id', account_id).execute()
        
        if not threads_result.data:
            logger.debug(f"No threads found for account {account_id}")
            return {
                'can_start': True,
                'running_count': 0,
                'running_thread_ids': []
            }
        
        thread_ids = [thread['thread_id'] for thread in threads_result.data]
        logger.debug(f"Found {len(thread_ids)} threads for account {account_id}")
        
        # Query for running agent runs within the past 24 hours for these threads
        from core.utils.query_utils import batch_query_in
        
        running_runs = await batch_query_in(
            client=client,
            table_name='agent_runs',
            select_fields='id, thread_id, started_at',
            in_field='thread_id',
            in_values=thread_ids,
            additional_filters={
                'status': 'running',
                'started_at_gte': twenty_four_hours_ago_iso
            }
        )
        
        running_count = len(running_runs)
        running_thread_ids = [run['thread_id'] for run in running_runs]
        
        logger.debug(f"Account {account_id} has {running_count} running agent runs in the past 24 hours")
        
        result = {
            'can_start': running_count < config.MAX_PARALLEL_AGENT_RUNS,
            'running_count': running_count,
            'running_thread_ids': running_thread_ids
        }
        return result

    except Exception as e:
        logger.error(f"Error checking agent run limit for account {account_id}: {str(e)}")
        # In case of error, allow the run to proceed but log the error
        return {
            'can_start': True,
            'running_count': 0,
            'running_thread_ids': []
        }


async def check_agent_count_limit(client, account_id: str) -> Dict[str, Any]:
    """
    Check if a user can create more agents based on their subscription tier.
    
    Args:
        client: Database client
        account_id: Account ID to check
        
    Returns:
        Dict containing:
        - can_create: bool - whether user can create another agent
        - current_count: int - current number of custom agents (excluding Suna defaults)
        - limit: int - maximum agents allowed for this tier
        - tier_name: str - subscription tier name
    
    Note: This function does not use caching to ensure real-time agent counts.
    """
    try:
        # In local mode, allow practically unlimited custom agents
        if config.ENV_MODE.value == "local":
            return {
                'can_create': True,
                'current_count': 0,  # Return 0 to avoid showing any limit warnings
                'limit': 999999,     # Practically unlimited
                'tier_name': 'local'
            }
        
        # Always query fresh data from database to avoid stale cache issues
        agents_result = await client.table('agents').select('agent_id, metadata').eq('account_id', account_id).execute()
        
        non_suna_agents = []
        for agent in agents_result.data or []:
            metadata = agent.get('metadata', {}) or {}
            is_suna_default = metadata.get('is_suna_default', False)
            if not is_suna_default:
                non_suna_agents.append(agent)
                
        current_count = len(non_suna_agents)
        logger.debug(f"Account {account_id} has {current_count} custom agents (excluding Suna defaults)")
        
        # Billing removed - no subscription tiers
        tier_name = 'free'
        logger.debug(f"Account {account_id} subscription tier: {tier_name} (billing disabled)")
        
        agent_limit = config.AGENT_LIMITS.get(tier_name, config.AGENT_LIMITS['free'])
        
        can_create = current_count < agent_limit
        
        result = {
            'can_create': can_create,
            'current_count': current_count,
            'limit': agent_limit,
            'tier_name': tier_name
        }
        
        logger.debug(f"Account {account_id} has {current_count}/{agent_limit} agents (tier: {tier_name}) - can_create: {can_create}")
        
        return result
        
    except Exception as e:
        logger.error(f"Error checking agent count limit for account {account_id}: {str(e)}", exc_info=True)
        return {
            'can_create': True,
            'current_count': 0,
            'limit': config.AGENT_LIMITS['free'],
            'tier_name': 'free'
        }


async def check_project_count_limit(client, account_id: str) -> Dict[str, Any]:
    """
    Check if a user can create more projects based on their subscription tier.

    Args:
        client: Database client
        account_id: Account ID to check

    Returns:
        Dict containing:
        - can_create: bool - whether user can create another project
        - current_count: int - current number of projects
        - limit: int - maximum projects allowed for this tier
        - tier_name: str - subscription tier name

    Note: This function does not use caching to ensure real-time project counts,
    preventing issues where deleted projects aren't immediately reflected in limits.
    """
    try:
        # Billing removed - project limits disabled
        logger.debug(f"Project limit check for account {account_id} - billing disabled, unlimited projects")

        return {
            'can_create': True,
            'current_count': 0,  # Return 0 to avoid showing any limit warnings
            'limit': 999999,     # Practically unlimited
            'tier_name': 'unlimited'
        }

    except Exception as e:
        logger.error(f"Error checking project count limit for account {account_id}: {str(e)}", exc_info=True)
        # Billing removed - always allow project creation on error
        return {
            'can_create': True,
            'current_count': 0,
            'limit': 999999,
            'tier_name': 'unlimited'
        }

