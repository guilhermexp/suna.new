#!/usr/bin/env python3
"""
Centrally Managed Agent Management Script

This script provides administrative functions for managing Suna and Claude Code CLI centrally managed agents across all users.

Usage:
    # 🚀 MAIN COMMANDS
    python manage_suna_agents.py install-all             # Install Suna for all users who don't have it
    python manage_suna_agents.py install-claude-all      # Install Claude Code CLI agent for all users
    python manage_suna_agents.py stats                   # Show Suna agent statistics
    python manage_suna_agents.py claude-stats            # Show Claude Code CLI agent statistics
    python manage_suna_agents.py install-user <id>       # Install Suna agent for specific user
    python manage_suna_agents.py install-claude-user <id> # Install Claude Code CLI agent for specific user

Examples:
    python manage_suna_agents.py install-all
    python manage_suna_agents.py install-claude-all
    python manage_suna_agents.py stats
    python manage_suna_agents.py claude-stats
    python manage_suna_agents.py install-user 123e4567-e89b-12d3-a456-426614174000

Note: Sync is no longer needed - centrally managed agents automatically use their current configuration.
"""

import asyncio
import argparse
import sys
import json
from pathlib import Path

# Add the backend directory to the path so we can import modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from core.utils.suna_default_agent_service import SunaDefaultAgentService
from core.utils.claude_code_agent_service import ClaudeCodeAgentService
from core.services.supabase import DBConnection
from core.utils.logger import logger


class SunaAgentManager:
    def __init__(self):
        self.service = SunaDefaultAgentService()
    
    async def install_all_users(self):
        """Install Suna agent for all users who don't have it"""
        print("🚀 Installing Suna default agent for all users who don't have it...")
        
        result = await self.service.install_for_all_users()
        
        print(f"✅ Installation completed!")
        print(f"   📦 Installed: {result['installed_count']}")
        print(f"   ❌ Failed: {result['failed_count']}")
        
        if result.get('details'):
            if result['failed_count'] > 0:
                print('\n❌ Installation details:')
            elif result['installed_count'] > 0:
                print('\nℹ️  Installation details:')
            for detail in result['details']:
                print(f"   - {detail}")

        if result['installed_count'] > 0:
            print(f"\n✅ Successfully installed Suna for {result['installed_count']} users")
            
    async def update_config_info(self):
        """Show information about Suna configuration (no sync needed)"""
        print("ℹ️  Suna Configuration Information")
        print("=" * 50)
        print("🔧 Suna agents automatically use the current configuration from config.py")
        print("📝 No sync needed - changes are applied immediately when agents run")
        print("💡 To update Suna behavior, simply modify backend/agent/suna/config.py")
        print("\n✅ All Suna agents are always up-to-date with your latest configuration!")
    
    async def install_user(self, account_id):
        """Install Suna agent for specific user"""
        print(f"🚀 Installing Suna default agent for user {account_id}...")
        
        agent_id = await self.service.install_suna_agent_for_user(account_id)
        
        if agent_id:
            print(f"✅ Successfully installed Suna agent {agent_id} for user {account_id}")
        else:
            print(f"❌ Failed to install Suna agent for user {account_id}")
    
    async def replace_user_agent(self, account_id):
        """Replace Suna agent for specific user (in case of corruption)"""
        print(f"🔄 Replacing Suna agent for user {account_id}...")
        
        # Install/replace the agent with latest config
        agent_id = await self.service.install_suna_agent_for_user(account_id, replace_existing=True)
        
        if agent_id:
            print(f"✅ Successfully replaced Suna agent {agent_id} for user {account_id}")
        else:
            print(f"❌ Failed to replace Suna agent for user {account_id}")
    
    async def show_stats(self):
        """Show Suna agent statistics"""
        print("📊 Suna Default Agent Statistics")
        print("=" * 50)
        
        stats = await self.service.get_suna_agent_stats()
        
        if 'error' in stats:
            print(f"❌ Error getting stats: {stats['error']}")
            return
        
        print(f"Total Agents: {stats.get('total_agents', 0)}")
        print(f"Active Agents: {stats.get('active_agents', 0)}")
        print(f"Inactive Agents: {stats.get('inactive_agents', 0)}")
        
        version_dist = stats.get('version_distribution', {})
        if version_dist:
            print(f"\nVersion Distribution:")
            for version, count in version_dist.items():
                print(f"  {version}: {count} agents")
        
        creation_dates = stats.get('creation_dates', {})
        if creation_dates:
            print(f"\nCreation Dates (Last 12 months):")
            for month, count in sorted(creation_dates.items(), reverse=True):
                print(f"  {month}: {count} agents")




class ClaudeCodeAgentManager:
    def __init__(self):
        self.service = ClaudeCodeAgentService()

    async def install_all_users(self):
        print('Installing Claude Code CLI agent for all users who do not have it...')
        result = await self.service.install_for_all_users()
        print('Installation completed!')
        print(f"   Installed: {result['installed_count']}")
        print(f"   Failed: {result['failed_count']}")
        print(f"   Remaining without agent: {result.get('total_missing', 0)}")
        if result.get('details'):
            print('Details:')
            for detail in result.get('details', []):
                print(f"   - {detail}")

    async def install_user(self, account_id: str):
        print(f"Installing Claude Code CLI agent for user {account_id}...")
        agent_id = await self.service.ensure_agent_for_user(account_id)
        if agent_id:
            print(f"Installed Claude Code CLI agent {agent_id} for user {account_id}")
        else:
            print(f"Failed to install Claude Code CLI agent for user {account_id}")

    async def replace_user_agent(self, account_id: str):
        print(f"Replacing Claude Code CLI agent for user {account_id}...")
        agent_id = await self.service.ensure_agent_for_user(account_id, replace_existing=True)
        if agent_id:
            print(f"Replaced Claude Code CLI agent {agent_id} for user {account_id}")
        else:
            print(f"Failed to replace Claude Code CLI agent for user {account_id}")

    async def show_stats(self):
        stats = await self.service.get_stats()
        print('Claude Code CLI Agent Statistics')
        print('=' * 50)
        print(f"Total Agents: {stats.get('total_agents', 0)}")
async def main():
    parser = argparse.ArgumentParser(
        description="Manage centrally managed agents (Suna and Claude Code CLI)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Main commands
    subparsers.add_parser('install-all', help='Install Suna agent for all users who don\'t have it')
    subparsers.add_parser('install-claude-all', help='Install Claude Code CLI agent for all users who don\'t have it')
    subparsers.add_parser('stats', help='Show Suna agent statistics')
    subparsers.add_parser('claude-stats', help='Show Claude Code CLI agent statistics')
    subparsers.add_parser('config-info', help='Show information about Suna configuration')
    
    # User-specific commands
    install_user_parser = subparsers.add_parser('install-user', help='Install Suna agent for specific user')
    install_user_parser.add_argument('account_id', help='Account ID to install Suna for')
    
    replace_user_parser = subparsers.add_parser('replace-user', help='Replace Suna agent for specific user (if corrupted)')
    replace_user_parser.add_argument('account_id', help='Account ID to replace Suna for')
    
    install_claude_parser = subparsers.add_parser('install-claude-user', help='Install Claude Code CLI agent for specific user')
    install_claude_parser.add_argument('account_id', help='Account ID to install the Claude Code CLI agent for')
    
    replace_claude_parser = subparsers.add_parser('replace-claude-user', help='Replace Claude Code CLI agent for specific user')
    replace_claude_parser.add_argument('account_id', help='Account ID to replace the Claude Code CLI agent for')
    
    # Legacy commands (deprecated but still functional)
    subparsers.add_parser('sync', help='[DEPRECATED] No longer needed - config is always current')
    subparsers.add_parser('update-all', help='[DEPRECATED] No longer needed - config is always current')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    suna_manager = SunaAgentManager()
    claude_manager = ClaudeCodeAgentManager()

    try:
        if args.command == 'install-all':
            await suna_manager.install_all_users()
        elif args.command == 'install-claude-all':
            await claude_manager.install_all_users()
        elif args.command == 'stats':
            await suna_manager.show_stats()
        elif args.command == 'claude-stats':
            await claude_manager.show_stats()
        elif args.command == 'config-info':
            await suna_manager.update_config_info()
        elif args.command == 'install-user':
            await suna_manager.install_user(args.account_id)
        elif args.command == 'install-claude-user':
            await claude_manager.install_user(args.account_id)
        elif args.command == 'replace-user':
            await suna_manager.replace_user_agent(args.account_id)
        elif args.command == 'replace-claude-user':
            await claude_manager.replace_user_agent(args.account_id)
        elif args.command == 'sync':
            print("⚠️  DEPRECATED: Sync is no longer needed!")
            await suna_manager.update_config_info()
        elif args.command == 'update-all':
            print("⚠️  DEPRECATED: Update-all is no longer needed!")
            await suna_manager.update_config_info()
        else:
            parser.print_help()
            
    except KeyboardInterrupt:
        print("\n⚠️  Operation cancelled by user")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        logger.error(f"Script error: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main()) 