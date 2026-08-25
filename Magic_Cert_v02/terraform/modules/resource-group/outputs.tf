output "resource_group_name" {
  description = "Main resource group name"
  value       = aws_resourcegroups_group.magic_cert.name
}

output "resource_group_arn" {
  description = "Main resource group ARN"
  value       = aws_resourcegroups_group.magic_cert.arn
}

output "resource_group_url" {
  description = "AWS Console URL for resource group"
  value       = "https://console.aws.amazon.com/resource-groups/group/${aws_resourcegroups_group.magic_cert.name}"
}

output "by_owner_group_name" {
  description = "By-owner resource group name"
  value       = aws_resourcegroups_group.by_owner.name
}

output "by_event_group_name" {
  description = "By-event resource group name"
  value       = aws_resourcegroups_group.by_event.name
}

output "tag_editor_url" {
  description = "AWS Tag Editor URL"
  value       = "https://console.aws.amazon.com/resource-groups/tag-editor"
}
